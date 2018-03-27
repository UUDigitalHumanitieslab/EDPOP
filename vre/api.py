from rest_framework import viewsets

from .serializers import *
from .models import Collection, Record


class CollectionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CollectionSerializer

    def get_queryset(self):
        groups = self.request.user.researchgroups.all()
        return Collection.objects.filter(managing_group__in=groups)


class RecordViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RecordSerializer
    queryset = Record.objects.all()
    filter_fields = ['uri', 'collection__id']
