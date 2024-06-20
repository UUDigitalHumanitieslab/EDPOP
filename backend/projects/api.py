from rest_framework import viewsets
from django.contrib.auth.models import AnonymousUser

from projects.models import Project
from projects.serializers import ProjectSerializer

class ProjectView(viewsets.ReadOnlyModelViewSet):
    '''
    Read-only endpoint to see available projects
    '''

    serializer_class = ProjectSerializer

    def get_queryset(self):
        user = self.request.user
        
        if user.is_superuser:
            return Project.objects.all()

        public = Project.objects.filter(public=True)

        if isinstance(user, AnonymousUser):
            return public

        direct_access = Project.objects.filter(users=user)
        access_through_group = Project.objects.filter(groups__user=user)
        return public.union(direct_access, access_through_group)
