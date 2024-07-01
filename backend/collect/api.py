from rest_framework.viewsets import ViewSet
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, NotFound, PermissionDenied
from rdflib import URIRef

from projects.api import user_projects
from projects.models import Project
from collect.rdf_models import EDPOPCollection
from collect.utils import name_to_slug

def _validate_required_keys(data, keys):
    for key in keys:
        if not key in data:
            raise ValidationError(f'Key {key} is required')


def _collection_uri(id: str):
    return URIRef(id, base='collections/')


class CollectionViewSet(ViewSet):
    '''
    Viewset for listing or retrieving collections
    '''

    def list(self, request):
        projects = user_projects(request.user)
        return Response([])
    
    def create(self, request):
        _validate_required_keys(request.data, ['name', 'summary', 'project'])
        project = self._get_project(request)
        graph = project.graph()
        uri = _collection_uri(name_to_slug(request.data['name']))

        collection = EDPOPCollection(graph, uri)
        collection.name = request.data['name']
        collection.summary = request.data['summary']
        collection.save()

        return Response(self._serialize_collection(collection))

    def retrieve(self, request, pk=None):
        return Response(None)

    def update(self, request, pk=None):
        return Response(None)

    def destroy(self, request, pk=None):
        return Response(None)

    def _get_project(self, request):
        '''
        get project from request data and verify permission
        '''

        project_name = request.data['project']
        projects = Project.objects.filter(name=project_name)
        if not projects.exists():
            raise NotFound(f'Project "{project_name}" does not exist')
        
        project = projects.first()
        
        if not project.permit_update_by(request.user):
            raise PermissionDenied('You do not have permission to edit data in this project.')

        return project
   

    def _serialize_collection(self, collection: EDPOPCollection):
        return {
            'uri': collection.uri,
            'name': collection.name,
            'summary': collection.summary,
        }