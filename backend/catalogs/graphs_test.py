import pytest
from edpop_explorer import readers

from .graphs import _get_reader_dict, get_reader_by_uriref, get_catalogs_graph


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
        return
    assert (sample_uriref, None, None) in graph
