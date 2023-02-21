from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.contrib.staticfiles import finders

CERL_SRU_URL = "http://sru.cerl.org/thesaurus"
HPB_SRU_URL = "http://sru.gbv.de/hpb"


@login_required
def index(request, database_id=None):
    with open(finders.find('vre/index.html')) as index_file:
        return HttpResponse(content=index_file)
