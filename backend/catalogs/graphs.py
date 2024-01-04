from django.conf import settings

from edpop_explorer import Reader
from rdflib import URIRef, Graph


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

READERS_BY_URIREF = _get_reader_dict()


def get_reader_by_uriref(uriref: URIRef) -> type[Reader]:
    """Return the reader class according to its URIRef. Raise ValueError
    if reader does not exist."""
    return READERS_BY_URIREF[uriref]


def get_catalogs_graph() -> Graph:
    """Get a graph containing information about all catalogs."""
    graphs = [x.catalog_to_graph() for x in _get_activated_readers()]
    graph = sum(graphs, Graph())  # Addition means union for graphs
    return graph
