from typing import Optional
import pytest
from edpop_explorer import readers, Reader, Record
from rdflib import URIRef

from .graphs import SearchGraphBuilder, _get_reader_dict, get_reader_by_uriref, get_catalogs_graph


class MockReader(Reader):
    """A special reader for testing purposes that does not access the
    internet to fetch results. Produces 25 records that all have
    their serial number (0 through 24) as their identifier."""
    MAX_ITEMS = 25
    IRI_PREFIX = "http://example.com/reader/"
    CATALOG_URIREF = URIRef("http://example.com/reader")

    def fetch(self, number: Optional[int] = None):
        to_fetch_start = self.number_fetched
        if number is None:
            number = 10
        to_fetch_end = self.number_fetched + number
        to_fetch_end = min(to_fetch_end, self.MAX_ITEMS)
        identifiers = range(to_fetch_start, to_fetch_end)
        self.records.extend([self.get_by_id(str(x)) for x in identifiers])
        self.number_of_results = self.MAX_ITEMS
        self.number_fetched = to_fetch_end

    @classmethod
    def get_by_id(cls, identifier: str) -> Record:
        record = Record(cls)
        record.identifier = identifier
        return record

    @classmethod
    def transform_query(cls, query: str) -> str:
        return query


class FetchAllMockReader(MockReader):
    FETCH_ALL_AT_ONCE = True


def test_mockreader_start_zero():
    reader = MockReader()
    reader.prepare_query("Hoi")
    reader.fetch(5)
    assert reader.number_fetched == 5
    assert len(reader.records) == 5
    assert reader.records[0].identifier == "0"
    assert not reader.fetching_exhausted
    reader.fetch()
    assert reader.number_fetched == 15
    assert reader.records[10].identifier == "10"
    reader.fetch()
    assert reader.number_fetched == 25
    assert reader.fetching_exhausted


def test_mockreader_start_at_five():
    # Skipping first records
    reader2 = MockReader()
    reader2.prepare_query("Hoi")
    reader2.adjust_start_record(5)
    reader2.fetch(5)
    assert reader2.number_fetched == 10
    assert reader2.records[0] is None
    assert reader2.records[5].identifier == "5"


@pytest.fixture(autouse=True)
def all_default_readers(settings):
    settings.CATALOG_READERS = readers.ALL_READERS


def test_get_reader_dict():
    readers = _get_reader_dict()
    for key in readers:
        value = readers[key]
        assert key == value.CATALOG_URIREF


def test_get_reader_by_uriref():
    uriref = readers.ALL_READERS[0].CATALOG_URIREF
    if uriref is not None:
        assert get_reader_by_uriref(uriref) == readers.ALL_READERS[0]
    else:
        pytest.skip("registered reader has no URIRef")


def test_get_catalogs_graph():
    graph = get_catalogs_graph()
    sample_uriref = readers.ALL_READERS[0].CATALOG_URIREF
    if sample_uriref is None:
        pytest.skip("registered reader has no URIRef")
    else:
        assert (sample_uriref, None, None) in graph


def mock_builder(query, **kwargs):
    builder = SearchGraphBuilder(MockReader)
    _ = builder.query_to_graph(query, **kwargs)
    return builder


def test_builder_first_results():
    builder = mock_builder("hoi", max_items=10)
    assert len(builder.records) == 10
    assert builder.records[0].identifier == "0"


def test_buider_later_results():
    builder = mock_builder("hoi", start=5, max_items=10)
    assert len(builder.records) == 10
    assert builder.records[0].identifier == "5"


def test_builder_more_than_available():
    builder = mock_builder("hoi", start=5, max_items=50)
    # Assert that only the available records are fetched, which is 
    # 20 because there are 25 records and we started with 5
    assert len(builder.records) == 20
    assert builder.records[0].identifier == "5"


def test_builder_with_caching():
    builder = SearchGraphBuilder(FetchAllMockReader)
    graph = builder.query_to_graph("hoi", max_items=10)
    # Just make sure that running this again does not cause any errors and
    # that the cache has been used.
    graph2 = builder.query_to_graph("hoi", max_items=10)
    assert builder.cache_used is True
