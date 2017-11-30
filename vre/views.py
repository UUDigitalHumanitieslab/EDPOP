from django.http import HttpResponse, HttpResponseRedirect
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, render
from .sru_query import sru_query

from .models import ResearchGroup, Collection


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
    # TODO: insert querying and result showing in view
    #url_string = "http://sru.cerl.org/thesaurus"
    #query_string = ""
    #search_result = sru_query(url_string, query_string)
    search_result = ""
    return render(request, 'vre/collection_detail.html', {'collection': collection,
                                                          'search_result': search_result})
