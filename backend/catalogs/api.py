from rest_framework import views
from rdf.views import RDFView
from rdflib import Graph

from .graphs import get_catalogs_graph


class SearchView(RDFView):
    """Search in a given external catalog according to a query."""
    
    def get_graph(self, request: views.Request, **kwargs) -> Graph:
        # To be implemented
        return Graph()


class CatalogsView(RDFView):
    """Return a graph containing all activated catalogs."""
    
    def get_graph(self, request: views.Request, **kwargs) -> Graph:
        graph = get_catalogs_graph()
        return graph
