from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.viewsets import ViewSetMixin
from rest_framework.response import Response
from rest_framework.decorators import list_route

from .serializers import *
from .models import Collection, Record
from .sru_query import sru_query, translate_sru_response_to_dict

HPB_SRU_URL = "http://sru.gbv.de/hpb"


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


class HPBViewSet(ViewSetMixin, APIView):
    def list(self, request, format=None):
        url_string = HPB_SRU_URL
        searchterm = request.query_params.get('search')
        if searchterm:
            try:
                search_result = sru_query(url_string, searchterm)
            except Exception as e:
                print(e)
            result_list = translate_sru_response_to_dict(
                search_result.text
            )
            return Response(result_list)
        else: 
            return Response({}) # to do: return http response code
