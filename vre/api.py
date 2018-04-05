from rest_framework import viewsets
from rest_framework.decorators import list_route

from .serializers import *
from .models import Collection, Record


class CollectionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CollectionSerializer

    @list_route()
    def mine(self, request):
        # get_queryset takes care of the reduced queryset
        return self.list(request)

    def get_queryset(self):
        queryset = Collection.objects
        if self.action == 'mine':
            groups = self.request.user.researchgroups.all()
            return queryset.filter(managing_group__in=groups)
        return queryset.all()


class RecordViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RecordSerializer
    queryset = Record.objects.all()
    filter_fields = ['uri', 'collection__id']
