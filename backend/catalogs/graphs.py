from django.conf import settings
from django.core.cache import cache
import hashlib

from edpop_explorer import Reader, Record
from rdflib import BNode, URIRef, Graph, RDF, Namespace, Literal

AS = Namespace("https://www.w3.org/ns/activitystreams#")

# Cache timeout in seconds for readers that fetch all results at once
CACHE_TIMEOUT = 60 * 60


def _hash(input_str: str) -> str:
    """Return a hashed (hex digest) version of the input string."""
    return hashlib.sha224(input_str.encode()).hexdigest()


def _get_activated_readers() -> list[type[Reader]]:
    """Get a list of all activated readers."""
    # Currently simply return all registered readers in settings.py, but
    # we may want to dynamically register and deregister readers in the 
    # future (e.g., to deactivate when a server is failing).
    return settings.CATALOG_READERS


def _get_reader_dict() -> dict[URIRef, type[Reader]]:
    """Return a dict allowing access to reader classes by URI."""
    # URIRefs are defined as a subclassed string, and can thus be used as keys
    return {x.CATALOG_URIREF: x for x in settings.CATALOG_READERS
            if x.CATALOG_URIREF}


def refresh_readers() -> None:
    """Refresh the list of loaded readers. Currently only used
    for unit tests."""
    global READERS_BY_URIREF
    READERS_BY_URIREF = _get_reader_dict()
    

READERS_BY_URIREF = _get_reader_dict()


def get_reader_by_uriref(uriref: URIRef) -> type[Reader]:
    """Return the reader class according to its URIRef. Raise KeyError
    if reader does not exist."""
    return READERS_BY_URIREF[uriref]


def get_catalogs_graph() -> Graph:
    """Get a graph containing information about all catalogs."""
    graphs = [x.catalog_to_graph() for x in _get_activated_readers()]
    graph = sum(graphs, Graph())  # Addition means union for graphs
    return graph


class SearchGraphBuilder:
    """Prepare and perform queries and build graphs from the results."""
    reader: Reader
    records: list[Record]
    _start: int
    _max_items: int
    #: True if cache was used instead of fetching
    cache_used: bool = False

    def __init__(self, readerclass: type[Reader]):
        self.reader = readerclass()

    def query_to_graph(
            self,
            query: str,
            start: int = 0,
            max_items: int = 50
    ) -> Graph:
        """Convenience method that subsequently calls the ``set_query``,
        ``perform_fetch`` and ``get_result_graph`` methods."""
        self.set_query(query, start, max_items)
        self.perform_fetch()
        return self.get_result_graph()

    def set_query(
            self,
            query: str,
            start: int = 0,
            max_items: int = 50
    ):
        """Set the query. Should be called before calling
        ``perform_fetch()``."""
        self._start = start
        if start != 0:
            self.reader.adjust_start_record(start)
        self.reader.prepare_query(query)
        self._max_items = max_items

    def perform_fetch(self):
        """Perform the fetch. This method is supposed to be called just
        once. After fetching, the requested records (and only those)
        are available in the ``records`` attribute, and ``get_result_graph()``
        can be called to create the accompanying graph."""
        self.cache_used = False
        identifier = None
        # Results are cached for readers that fetch all records at once. These
        # are readers that cannot fetch a specific subset of records, so they
        # always have to perform a (possibly expensive) full fetch.
        # To identify caches, the `generate_identifier()` method of a reader
        # is used, but this is hashed because this identifier may be too
        # long and complicated to be used as a cache key. Two hashes may
        # theoretically be used for the same identifier, so check if the
        # reader from the cache is indeed appropriate.
        if self.reader.FETCH_ALL_AT_ONCE:
            identifier = _hash(self.reader.generate_identifier())
            cached_reader = cache.get(identifier)
            if cached_reader is not None and (
                    cached_reader.prepared_query != self.reader.prepared_query
                    or type(cached_reader) is not type(self.reader)):
                # Reader types and/or queries are not identical, so ignore cache
                cached_reader = None
            if cached_reader is not None:
                self.reader = cached_reader
                self.cache_used = True
        if not self.cache_used:
            self.reader.fetch(self._max_items)
            if self.reader.FETCH_ALL_AT_ONCE:
                # Save reader in cache
                assert identifier is not None
                cache.set(identifier, self.reader, CACHE_TIMEOUT)
        self.records = self._get_partial_results()

    def _get_partial_results(self) -> list[Record]:
        if self._max_items <= len(self.reader.records):
            end = self._start + self._max_items
        else:
            end = len(self.reader.records)
        results = self.reader.records[self._start:end]
        if not all([isinstance(x, Record) for x in results]):
            raise RuntimeError("Some results are None - this should not happen.")
        return results  # type: ignore

    def _get_content_graph(self) -> Graph:
        """Return a graph containing the information of all requested
        records."""
        results = self.records
        graphs = [x.to_graph() for x in results if isinstance(x, Record)]
        content_graph = sum(graphs, Graph())
        return content_graph
    
    def _get_collection_graph(self) -> Graph:
        """Return a graph with an ActivityStreams Collection containing
        references to the requested records in the right order."""
        graph = Graph()
        subject_node = BNode()
        graph.add((subject_node, RDF.type, AS.OrderedCollection))
        collection_node = BNode()
        collection = graph.collection(collection_node)
        graph.add((subject_node, AS.orderedItems, collection_node))
        for record in self.records:
            if record.iri is not None:
                collection.append(URIRef(record.iri))
        graph.add((
            subject_node,
            AS.totalItems,
            Literal(self.reader.number_of_results)
        ))
        return graph

    def get_result_graph(self) -> Graph:
        """Represent the fetched records in a graph with an ActivityStreams
        collection."""
        return self._get_collection_graph() + self._get_content_graph()
