from rest_framework.viewsets import ViewSet
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, NotFound, PermissionDenied
from projects.api import user_projects
from projects.models import Project

def validate_required_keys(data, keys):
    for key in keys:
        if not key in data:
            raise ValidationError(f'Key {key} is required')

class CollectionViewSet(ViewSet):
    '''
    Viewset for listing or retrieving collections
    '''

    def list(self, request):
        projects = user_projects(request.user)
        return Response([])
    
    def create(self, request):
        validate_required_keys(request.data, ['id', 'name', 'summary', 'project'])
        project = self._get_project(request)

        return Response(None)

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