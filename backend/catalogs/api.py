from rdf.renderers import TurtleRenderer, JsonLdRenderer
from rest_framework import views
from rdf.views import RDFView
from rdflib import Graph, URIRef
from rest_framework.exceptions import ParseError
from rest_framework.renderers import JSONRenderer

from .graphs import SearchGraphBuilder, get_catalogs_graph, get_reader_by_uriref


class SearchView(RDFView):
    """Search in a given external catalog according to a query."""
    
    def get_graph(self, request: views.Request, **kwargs) -> Graph:
        try:
            catalog = request.query_params["catalog"]
            query = request.query_params["query"]
            start = request.query_params.get("start", "0")
            end = request.query_params.get("end", "50")
        except KeyError as err:
            raise ParseError(f"Query parameter missing: {err}")
        assert isinstance(catalog, str)
        assert isinstance(query, str)
        assert isinstance(start, str)
        assert isinstance(end, str)
        catalog_uriref = URIRef(catalog)
        start = int(start)
        end = int(end)
        
        try:
            readerclass = get_reader_by_uriref(catalog_uriref)
        except KeyError:
            raise ParseError(f"Requested catalog does not exist: {catalog_uriref}")
        builder = SearchGraphBuilder(readerclass)
        builder.set_query(query, start, end)
        builder.perform_fetch()
        return builder.get_result_graph()


class CatalogsView(RDFView):
    """Return a graph containing all activated catalogs."""
    renderer_classes = (JsonLdRenderer,)
    json_ld_context = {
        "schema": "https://schema.org/",
        "name": "schema:name",
        "description": "schema:description",
        "identifier": "schema:identifier",
    }
    
    def get_graph(self, request: views.Request, **kwargs) -> Graph:
        graph = get_catalogs_graph()
        return graph
