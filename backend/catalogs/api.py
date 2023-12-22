from rest_framework import views
from rdf.views import RDFView
from rdflib import Graph


class SearchView(RDFView):
    """
    Search in a given external catalog according to a query.
    """
    def get_graph(self, request: views.Request, **kwargs) -> Graph:
        # To be implemented
        return Graph()