from django.test import Client
from rest_framework.status import is_success, is_client_error
from rdflib import URIRef, RDF, Literal
from django.conf import settings
from urllib.parse import quote
from typing import Dict

from triplestore.constants import EDPOPCOL, AS
from collect.utils import collection_uri
from projects.models import Project

def example_collection_data(project_name) -> Dict:
    return {
        'name': 'My collection',
        'summary': 'These are my favourite records',
        'project': project_name,
    }

def post_collection(client, project_name):
    data = example_collection_data(project_name)
    return client.post('/api/collections/', data, content_type='application/json')

def test_create_collection(db, user, project, client: Client):
    client.force_login(user)

    response = post_collection(client, project.name)
    assert is_success(response.status_code)
    uri = URIRef(response.data['uri'])

    store = settings.RDFLIB_STORE
    assert any(store.triples((uri, RDF.type, EDPOPCOL.Collection)))


def test_create_fails_if_collection_exists(db, user, project, client: Client):
    client.force_login(user)
    success_response = post_collection(client, project.name)
    assert is_success(success_response.status_code)
    uri = URIRef(success_response.data['uri'])

    # try to create a collection at the same location
    fail_response = client.post('/api/collections/', {
        'name': 'My collection',
        'summary': 'I like these too',
        'project': project.name
    })
    assert is_client_error(fail_response.status_code)

    store = settings.RDFLIB_STORE
    is_stored = lambda triple: any(store.triples(triple))
    assert is_stored((uri, AS.summary, Literal('These are my favourite records')))
    assert not is_stored((uri, AS.summary, Literal('I like these too')))


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


def collection_detail_url(collection_uri: str) -> str:
    return '/api/collections/{}/'.format(quote(collection_uri, safe=''))


def test_retrieve_collection(db, user, project, client: Client):
    client.force_login(user)
    create_response = post_collection(client, project.name)

    
    correct_url = collection_detail_url(create_response.data['uri'])
    nonexistent_uri = collection_uri('does not exist')

    not_found_response = client.get(collection_detail_url(nonexistent_uri))
    assert not_found_response.status_code == 404

    success_response = client.get(correct_url)
    assert is_success(success_response.status_code)
    assert success_response.data['name'] == 'My collection'

    client.logout()
    no_permission_response = client.get(correct_url)
    assert no_permission_response.status_code == 403

def test_delete_collection(db, user, project, client: Client):
    client.force_login(user)
    create_response = post_collection(client, project.name)

    detail_url = collection_detail_url(create_response.data['uri'])
    delete_response = client.delete(detail_url)
    assert is_success(delete_response.status_code)

    retrieve_response = client.get(detail_url)
    assert retrieve_response.status_code == 404

def test_update_collection(db, user, project, client: Client):
    client.force_login(user)

    create_response = post_collection(client, project.name)
    detail_url = collection_detail_url(create_response.data['uri'])

    data = example_collection_data(project.name)
    data.update({'summary': 'I don\'t like these anymore'})

    update_response = client.put(detail_url, data, content_type='application/json')
    assert is_success(update_response.status_code)
    assert update_response.data['summary'] == 'I don\'t like these anymore'


def test_project_validation(db, user, client: Client):
    client.force_login(user)

    Project.objects.create(name='secret', display_name='Top secret records')

    response = client.post('/api/collections/', {
        'name': 'new collection',
        'summary': None,
        'project': 'secret',
    }, content_type='application/json')

    assert is_client_error(response.status_code)

def test_collection_records(db, user, project, client: Client):
    client.force_login(user)
    create_response = post_collection(client, project.name)
    collection_uri = create_response.data['uri']

    records_url = '/api/collection-records/' + collection_uri + '/'

    response = client.get(records_url)
    assert is_success(response.status_code)