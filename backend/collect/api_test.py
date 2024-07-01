from django.test import Client
from rest_framework.status import is_success
from rdflib import URIRef, RDF
from django.conf import settings

from triplestore.constants import EDPOPCOL

def test_create_collection(db, user, project, client: Client):
    client.force_login(user)

    data = {
        'name': 'My collection',
        'summary': 'These are my favourite records',
        'project': project.name,
    }
    response = client.post('/api/collections/', data, content_type='application/json')
    assert is_success(response.status_code)
    uri = URIRef(response.data['uri'])

    store = settings.RDFLIB_STORE

    assert store.triples((uri, RDF.type, EDPOPCOL.Collection))
