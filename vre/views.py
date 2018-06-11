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


# to do: link to detail view for the collections
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

def add_records_to_collections(request):
    records_and_collections = json.loads(request.body.decode())
    collections = records_and_collections['collections']
    if not collections:
        return JsonResponse({"error": "No collection selected!"}, status=400)
    records = records_and_collections['records']
    if not records:
        return JsonResponse({"error": "No records selected!"}, status=400)
    response_dict = {}
    for collection_id in collections:
        collection = get_object_or_404(Collection, pk=collection_id)
        record_counter = 0
        for record in records:
            records_in_collection = [r.uri for r in collection.record_set.all()]
            uri = record["uri"]
            if uri not in records_in_collection:
                existing_record = Record.objects.filter(uri=uri)
                if existing_record:
                    existing_record[0].collection.add(collection)
                else:
                    new_record = Record(
                        uri=uri,
                        content=record['content'],
                    )
                    new_record.save()
                    new_record.collection.add(collection)
                record_counter += 1
        response_dict[collection.description] = record_counter
    return JsonResponse(response_dict)