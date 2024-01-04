from typing import Union
from rest_framework import views
from rdf.views import RDFView
from rdflib import Graph, URIRef
from rest_framework.exceptions import APIException, ParseError

from .graphs import SearchGraphBuilder, get_catalogs_graph, get_reader_by_uriref


class SearchView(RDFView):
    """Search in a given external catalog according to a query."""
    
    def get_graph(self, request: views.Request, **kwargs) -> Graph:
        try:
            catalog = request.query_params["catalog"]
            query = request.query_params["query"]
            start = request.query_params.get("start", "0")
            max_items = request.query_params.get("max_items", "50")
        except KeyError as err:
            raise ParseError(f"Query parameter missing: {err}")
        assert isinstance(catalog, str)
        assert isinstance(query, str)
        assert isinstance(start, str)
        assert isinstance(max_items, str)
        catalog_uriref = URIRef(catalog)
        start = int(start)
        max_items = int(max_items)
        
        try:
            readerclass = get_reader_by_uriref(catalog_uriref)
        except KeyError:
            raise ParseError(f"Requested catalog does not exist: {catalog_uriref}")
        builder = SearchGraphBuilder(readerclass)
        builder.set_query(query, start, max_items)
        builder.perform_fetch()
        return builder.get_result_graph()


class CatalogsView(RDFView):
    """Return a graph containing all activated catalogs."""
    
    def get_graph(self, request: views.Request, **kwargs) -> Graph:
        graph = get_catalogs_graph()
        return graph
