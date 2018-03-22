import json

from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, render, render_to_response

from .sru_query import sru_query, translate_sru_response_to_dict
from .models import Record, ResearchGroup, Collection

CERL_SRU_URL = "http://sru.cerl.org/thesaurus"
HPB_SRU_URL = "http://sru.gbv.de/hpb"


# to do: link to detail view for the collections
@login_required
def index(request):
    user_groups = list(request.user.researchgroups.all())
    user_collections = Collection.objects.filter(
        managing_group__in=user_groups
    )
    return render(
        request, 
        'vre/index.html', 
        {'user_collections': set(user_collections)}
    )


def collection_detail(request, collection_id):
    collection = get_object_or_404(Collection, pk=collection_id)
    url_string = HPB_SRU_URL
    response_dict = {'collection': collection}
    if not request.method == 'POST':
        return render(request, 'vre/collection_detail.html', response_dict)
    else:
        searchterm = request.POST.get('search', None)
        if searchterm:
            try:
                search_result = sru_query(url_string, searchterm)
            except Exception as e:
                print(e)
            result_list = translate_sru_response_to_dict(
                search_result.content
            )
            results_json = [
                json.dumps(record['datafields']) for record in result_list
            ]
            combined_results = zip(result_list, results_json)
            response_dict.update({'result_list': combined_results})
            return render(
                request, 
                'vre/collection_detail.html',
                response_dict
            )


def add_records_to_collection(request, collection_id):
    collection = get_object_or_404(Collection, pk=collection_id)
    selected_records = json.loads(request.body.decode())
    if selected_records:
        print(selected_records)
        records_in_collection = [r.uri for r in collection.record_set.all()]
        for record in selected_records:
            uri = record["uri"]
            if not uri in records_in_collection:
                del record["uri"]
                new_record = Record(
                    uri=uri,
                    content=record,
                    annotation=''
                )
                new_record.save()
                new_record.collection.add(collection)
        return JsonResponse({'success': 'records added!'})
    else:
        return JsonResponse({'error': 'no records selected!'}, status=400)


def item_detail(request, result):
    return render(request, 'vre/item_detail.html', {'result': result})