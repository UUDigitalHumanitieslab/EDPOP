from rest_framework.viewsets import ViewSet
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, NotFound, PermissionDenied
from rdflib import URIRef, RDF, Graph
from django.conf import settings
from django.contrib.auth.models import User

from projects.api import user_projects
from projects.models import Project
from collect.rdf_models import EDPOPCollection
from collect.utils import _name_to_slug, collection_exists
from triplestore.constants import EDPOPCOL
from collect.serializers import CollectionSerializer


def _collection_uri(name: str):
    id = _name_to_slug(name)
    return URIRef(settings.RDF_NAMESPACE_ROOT + 'collections/' + id)


class CollectionViewSet(ViewSet):
    '''
    Viewset for listing or retrieving collections
    '''

    lookup_value_regex = '.+'


    def get_queryset(self):
        projects = user_projects(self.request.user)
        return [
            EDPOPCollection(project.graph(), uri)
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
        return EDPOPCollection(graph, uri)


    def list(self, request):
        collections = self.get_queryset()
        serializer = CollectionSerializer(collections, many=True)
        return Response(serializer.data)
    
    def create(self, request):
        uri = _collection_uri(request.data['name'])

        if collection_exists(uri):
            raise ValidationError(f'Collection {uri} already exists')

        serializer = CollectionSerializer(data = request.data)
        serializer.is_valid(raise_exception=True)
        collection = serializer.save()
        collection.save()
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        collection = self.get_object()
        self._check_access(request.user, collection, False)
        serializer = CollectionSerializer(collection)
        return Response(serializer.data)

    def update(self, request, pk=None):
        collection = self.get_object()
        self._check_access(request.user, collection, True)

        serializer = CollectionSerializer(collection, request.data)
        serializer.is_valid(raise_exception=True)
        collection = serializer.save()
        collection.save()
        return Response(serializer.data)

    def destroy(self, request, pk=None):
        collection = self.get_object()
        self._check_access(request.user, collection, True)
        collection.delete()
        return Response(None)

    def _get_project(self, data, user: User):
        '''
        get project from request data and verify permission
        '''

        project_name = data['project']
        projects = Project.objects.filter(name=project_name)
        if not projects.exists():
            raise NotFound(f'Project "{project_name}" does not exist')
        
        project = projects.first()
        
        if not project.permit_update_by(user):
            raise PermissionDenied('You do not have permission to edit data in this project.')

        return project


    def _check_access(self, user: User, collection: EDPOPCollection, is_update = False):
        project_uri = collection.project
        project = Project.objects.get(uri=project_uri)

        if not project.permit_query_by(user):
            raise PermissionDenied('You do not have permission to view data in this project')

        if is_update and not project.permit_update_by(user):
            raise PermissionDenied('You do not have permission to edit data in this project')
