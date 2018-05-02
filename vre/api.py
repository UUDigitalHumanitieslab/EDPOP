
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.viewsets import ViewSetMixin
from rest_framework.response import Response
from rest_framework.decorators import list_route
from rest_framework.renderers import JSONRenderer


from .serializers import *
from .models import *
from .sru_query import sru_query, translate_sru_response_to_dict

HPB_SRU_URL = "http://sru.gbv.de/hpb"


class ListMineMixin(object):
    """
    Mixin for viewsets that adds a /mine/ list route.

    Suppose that the normal list route on your viewset returns all animals.
    Then the /mine/ list route will return all animals that are in or belong
    to one of the resarch groups of the current user. Like this:

        /api/animals/       => Cat, Dog, Cow, Pig, Chicken
        /api/animals/mine/  => Cat, Pig, Chicken

    In order to use, inherit from this class *before* the ViewSet base class.
    Specify the `queryset` property on the child class. In addition, either
    specify the `group_field` property or override `get_queryset_mine`.

    The `group_field` property may be any field name on your model that
    references a ResearchGroup. It may also span relationships. For example, if
    each Animal has a Stable and each Stable belongs to a ResearchGroup, then
    your `group_field` might be `stable__research_group`. For further
    information on field lookups that span relationships, refer to the Django
    documentation:

    https://docs.djangoproject.com/en/1.11/topics/db/queries/#lookups-that-span-relationships

    As an alternative to the `group_field` property, you may override the
    `get_queryset_mine` method. This method takes no arguments other than
    `self` and should return the reduced queryset, containing only the objects
    that belong to a research group of the current user.
    """

    @list_route()
    def mine(self, request):
        # get_queryset takes care of the reduced queryset
        return self.list(request)

    def get_queryset(self):
        if self.action == 'mine':
            return self.get_queryset_mine()
        return self.queryset.all()

    def get_queryset_mine(self):
        groups = self.get_groups()
        group_filter = {self.group_field + '__in': groups}
        return self.queryset.filter(**group_filter)

    def get_groups(self):
        """ Returns the ResearchGroups the current user is a member of. """
        return self.request.user.researchgroups.all()

    # We manually enforce application/json for this route, because Safari
    # has a bug that sometimes causes it to send the wrong Accept header.
    def perform_content_negotiation(self, request, force=False):
        if self.action == 'mine':
            renderer = JSONRenderer()
            return renderer, renderer.media_type
        return super().perform_content_negotiation(request, force)


class ResearchGroupViewSet(ListMineMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = ResearchGroupSerializer
    queryset = ResearchGroup.objects.all()

    def get_queryset_mine(self):
        return self.get_groups()


class CollectionViewSet(ListMineMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = CollectionSerializer
    queryset = Collection.objects.all()
    group_field = 'managing_group'
    filter_fields = ['managing_group__id']


class RecordViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RecordSerializer
    queryset = Record.objects.all()
    filter_fields = ['uri', 'collection__id']


class SearchViewSet(ViewSetMixin, APIView):
    def list(self, request, format=None):
        searchterm = request.query_params.get('search')
        if not searchterm:
            return Response("search field empty", status=status.HTTP_400_BAD_REQUEST)
        search_source = request.query_params.get('source')
        print(request.query_params)
        if 'startRecord' in request.query_params:
            startRecord = request.query_params.get('startRecord')
        else:
            startRecord = 1
        if search_source=="HPB":
            url_string = HPB_SRU_URL
            try:
                search_result = sru_query(url_string, searchterm, startRecord=startRecord)
            except Exception as e:
                return Response(e, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            result_info = translate_sru_response_to_dict(
                search_result.text
            )
        else:
            # searching records in collection: do they contain the search term anywhere in content?
            records = Record.objects.filter(collection__id=search_source)
            search_results = records.filter(content__icontains=searchterm)
            result_list = [RecordSerializer(result).data for result in search_results]
            result_info = {'total_results': len(search_results), 'result_list': result_list}
        return Response(result_info)

class AnnotationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AnnotationSerializer
    queryset = Annotation.objects.all()
    filter_fields = ['record__id', 'record__uri']
