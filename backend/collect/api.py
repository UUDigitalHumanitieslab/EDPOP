from rest_framework.viewsets import ModelViewSet
from rest_framework.exceptions import NotFound
from rdflib import URIRef, RDF, Graph
from django.conf import settings

from projects.api import user_projects
from collect.rdf_models import EDPOPCollection
from collect.utils import collection_exists, collection_graph
from triplestore.constants import EDPOPCOL
from collect.serializers import CollectionSerializer
from collect.permissions import CollectionPermission

class CollectionViewSet(ModelViewSet):
    '''
    Viewset for listing or retrieving collections
    '''

    lookup_value_regex = '.+'
    serializer_class = CollectionSerializer
    permission_classes = [CollectionPermission]

    def get_queryset(self):
        projects = user_projects(self.request.user)
        return [
            EDPOPCollection(collection_graph(uri), uri)
            for project in projects
            for uri in project.rdf_model().collections
        ]


    def get_object(self):
        uri = URIRef(self.kwargs['pk'])

        if not collection_exists(uri):
            raise NotFound(f'Collection does not exist')

        store = settings.RDFLIB_STORE
        context = next(store.contexts((uri, RDF.type, EDPOPCOL.Collection)))
        graph = Graph(store, context)
        collection = EDPOPCollection(graph, uri)
        self.check_object_permissions(self.request, collection)
        return collection

