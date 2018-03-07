from django.http import HttpResponse, HttpResponseRedirect
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, render, render_to_response

from .sru_query import sru_query, translate_sru_response_to_dict
from .models import Record, ResearchGroup, Collection
from .forms import AddMultipleItemsForm

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


def found_records(list_of_results):
    choices = [l['uri'] for l in list_of_results]
    return choices


def multiple_add_to_collection(result_list):
    return None


def create_post(request):
   print("just checkin'")



def collection_detail(request, collection_id, result_list=[]):
    collection = get_object_or_404(Collection, pk=collection_id)
    url_string = HPB_SRU_URL
    if request.method == 'POST':
        searchterm = request.POST.get('search', None)
        selected_records = request.POST.getlist('selected_records')
        if searchterm:
            try:
                search_result = sru_query(url_string, searchterm)
            except Exception as e:
                print(e)
            result_list = translate_sru_response_to_dict(
                search_result.content)
            #multiple_select_form = AddMultipleItemsForm()
            #multiple_select_form.fields['record'].choices = found_records(result_list)
            return render(
                request, 
                'vre/collection_detail.html',
                {'collection': collection, 'result_list': result_list}
            )
        # if selected_records:
        #     for record_index in selected_records:
        #         print(result_list)
        #         record = Record(
        #             uri=result_list[int(record_index)].uri,
        #             collection=collection,
        #             content=result_list[int(record_index)].datafields,
        #             annotation=''
        #         )
        #         record.save()
        #     return HttpResponse(selected_records) # forward to collection view?'''
    else:
        return render(request, 'vre/collection_detail.html', {'collection': collection})


def item_detail(request, result):
    return render(request, 'vre/item_detail.html', {'result': result})