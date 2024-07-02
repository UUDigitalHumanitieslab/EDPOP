from django.test import Client
from rest_framework.status import is_success
from rdflib import URIRef, RDF
from django.conf import settings
from urllib.parse import quote

from triplestore.constants import EDPOPCOL

def post_collection(client, project_name):
    data = {
        'name': 'My collection',
        'summary': 'These are my favourite records',
        'project': project_name,
    }
    return client.post('/api/collections/', data, content_type='application/json')

def test_create_collection(db, user, project, client: Client):
    client.force_login(user)

    response = post_collection(client, project.name)
    assert is_success(response.status_code)
    uri = URIRef(response.data['uri'])

    store = settings.RDFLIB_STORE

    assert store.triples((uri, RDF.type, EDPOPCOL.Collection))


def test_list_collections(db, user, project, client: Client):
    client.force_login(user)

    response = client.get('/api/collections/')
    assert is_success(response.status_code)    
    assert len(response.data) == 0

    response = post_collection(client, project.name)

    response = client.get('/api/collections/')
    assert is_success(response.status_code)    
    assert len(response.data) == 1
    assert response.data[0]['uri'] == settings.RDF_NAMESPACE_ROOT + 'collections/my_collection'
    assert response.data[0]['name'] == 'My collection'


def test_retrieve_collection(db, user, project, client: Client):
    client.force_login(user)

    response = post_collection(client, project.name)
    uri = response.data['uri']

    retrieve_url = '/api/collections/{}/'.format(quote(uri, safe=''))
    response = client.get(retrieve_url)
    assert is_success(response.status_code)
    assert response.data['name'] == 'My collection'
