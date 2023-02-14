from django.contrib.auth.decorators import login_required
from django.shortcuts import render

CERL_SRU_URL = "http://sru.cerl.org/thesaurus"
HPB_SRU_URL = "http://sru.gbv.de/hpb"


@login_required
def index(request, database_id=None):
    return render(request, 'vre/index.html')
