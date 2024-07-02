from django.test import Client
from rest_framework.status import is_success
from rdflib import URIRef, RDF
from django.conf import settings
from urllib.parse import quote

from triplestore.constants import EDPOPCOL
from collect.api import _collection_uri

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

    retrieve_url = lambda uri: '/api/collections/{}/'.format(quote(uri, safe=''))
    correct_url = retrieve_url(response.data['uri'])
    nonexistent_uri = _collection_uri('does not exist')

    response = client.get(retrieve_url(nonexistent_uri))
    assert response.status_code == 404

    response = client.get(correct_url)
    assert is_success(response.status_code)
    assert response.data['name'] == 'My collection'

    client.logout()
    response = client.get(correct_url)
    assert response.status_code == 403

