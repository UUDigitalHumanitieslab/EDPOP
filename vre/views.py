from django.http import HttpResponse, HttpResponseRedirect
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, render
from .sru_query import sru_query, translate_sru_response_to_readable_text

from .models import ResearchGroup, Collection

CERL_SRU_URL = "http://sru.cerl.org/thesaurus"
HPB_SRU_URL = "http://sru.gbv.de/hpb"


# to do: link to detail view for the collections
@login_required
def index(request):
    user_groups = list(request.user.researchgroups.all())
    user_collections = Collection.objects.filter(
        managing_group__in=user_groups
    )
    return render(request, 'vre/index.html', {'user_collections': set(user_collections)})


def collection_detail(request, collection_id):
    collection = get_object_or_404(Collection, pk=collection_id)
    url_string = HPB_SRU_URL
    # TODO actually retrieve query and use this as the querystring
    query_string = "utrecht"
    search_result = sru_query(url_string, query_string)
    search_result_translated = translate_sru_response_to_readable_text(search_result.content)
    return render(request, 'vre/collection_detail.html', {'collection': collection,
                                                          'search_result': search_result_translated})
