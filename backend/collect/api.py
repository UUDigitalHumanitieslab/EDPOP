from rest_framework.viewsets import ViewSet
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, NotFound, PermissionDenied
from rdflib import URIRef, RDF, Graph
from django.conf import settings
from django.contrib.auth.models import User

from projects.api import user_projects
from projects.models import Project
from collect.rdf_models import EDPOPCollection
from collect.utils import name_to_slug
from triplestore.constants import EDPOPCOL

def _validate_required_keys(data, keys):
    for key in keys:
        if not key in data:
            raise ValidationError(f'Key {key} is required')


def _collection_uri(name: str):
    id = name_to_slug(name)
    return URIRef(settings.RDF_NAMESPACE_ROOT + 'collections/' + id)


class CollectionViewSet(ViewSet):
    '''
    Viewset for listing or retrieving collections
    '''

    lookup_value_regex = '.+'

    def list(self, request):
        projects = user_projects(request.user)

        for project in projects:
            model = project.rdf_model()
            collections = model.collections

        collections = [
            EDPOPCollection(project.graph(), uri)
            for project in projects
            for uri in project.rdf_model().collections
        ]
        serialized = list(map(self._serialize_collection, collections))
        return Response(serialized)
    
    def create(self, request):
        _validate_required_keys(request.data, ['name', 'summary', 'project'])
        project = self._get_project(request.data, request.user)
        graph = project.graph()
        uri = _collection_uri(request.data['name'])

        collection = EDPOPCollection(graph, uri)
        self._update_from_request_data(collection, request.data, request.user)
        collection.save()

        return Response(self._serialize_collection(collection))

    def retrieve(self, request, pk=None):
        uri = URIRef(pk)
        collection = self._get_collection(uri)
        self._check_access(request.user, collection, False)
        return Response(self._serialize_collection(collection))

    def update(self, request, pk=None):
        _validate_required_keys(request.data, ['name', 'summary', 'project'])
        uri = URIRef(pk)
        collection = self._get_collection(uri)
        self._check_access(request.user, collection, True)
        self._update_from_request_data(collection, request.data, request.user)
        collection.save()
        return Response(self._serialize_collection(collection))

    def destroy(self, request, pk=None):
        uri = URIRef(pk)
        collection = self._get_collection(uri)
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
   

    def _serialize_collection(self, collection: EDPOPCollection):
        project_uri = str(collection.project)
        project = Project.objects.get(uri=project_uri)

        return {
            'uri': str(collection.uri),
            'name': collection.name,
            'summary': collection.summary,
            'project': project.name,
        }
    
    def _get_collection(self, uri):
        store = settings.RDFLIB_STORE
        triples = store.triples((uri, RDF.type, EDPOPCOL.Collection))
        result, _ = next(triples, (None, None))

        if not result:
            raise NotFound(f'Collection does not exist')

        context = next(store.contexts(result))
        graph = Graph(store, context)
        return EDPOPCollection(graph, uri)

    def _check_access(self, user: User, collection: EDPOPCollection, is_update = False):
        project_uri = collection.project
        project = Project.objects.get(uri=project_uri)

        if not project.permit_query_by(user):
            raise PermissionDenied('You do not have permission to view data in this project')

        if is_update and not project.permit_update_by(user):
            raise PermissionDenied('You do not have permission to edit data in this project')

    def _update_from_request_data(self, collection: EDPOPCollection, data, user):
        project = self._get_project(data, user)
        collection.name = data['name']
        collection.summary = data['summary']
        collection.project = project.identifier()
        return collection
