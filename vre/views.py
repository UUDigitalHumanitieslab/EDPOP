import json

from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, render, render_to_response
from django.core import serializers
from rest_framework.renderers import JSONRenderer

from .sru_query import sru_query, translate_sru_response_to_dict
from .models import Record, ResearchGroup, Collection
from .serializers import CollectionSerializer, ResearchGroupSerializer

CERL_SRU_URL = "http://sru.cerl.org/thesaurus"
HPB_SRU_URL = "http://sru.gbv.de/hpb"


@login_required
def index(request, database_id=None):
    user_groups = list(request.user.researchgroups.all())
    user_collections = Collection.objects.filter(
         managing_group__in=user_groups
    )
    all_groups = ResearchGroup.objects.all()
    prefetched_collections = CollectionSerializer(user_collections, many=True)
    prefetched_groups = ResearchGroupSerializer(all_groups, many=True)
    response_dict = {
        'prefetched_collections': JSONRenderer().render(prefetched_collections.data),
        'prefetched_groups': JSONRenderer().render(prefetched_groups.data)}
    if database_id:
        response_dict['id'] = database_id
    return render(
        request,
        'vre/index.html',
        response_dict
    )