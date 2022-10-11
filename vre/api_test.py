import pytest

import json

from .models import Record, Collection


# TODO: move the constants and fixtures below to a conftest.py

RECORDS = [
    {'uri': 'http://testing.test/1', 'content': {}},
    {'uri': 'http://testing.test/2', 'content': {}},
]

COLLECTIONS = [
    {'description': 'fun collection'},
    {'description': 'serious collection'},
]


@pytest.fixture
def records(db):
    for data in RECORDS:
        Record(**data).save()
    yield Record.objects
    Record.objects.all().delete()


@pytest.fixture
def collections(db):
    for data in COLLECTIONS:
        Collection(**data).save()
    yield Collection.objects
    Collection.objects.all().delete()


@pytest.fixture
def auth_user(django_user_model, db):
    name = 'tester'
    pw = 'testing 123'
    user = django_user_model.objects.create_user(username=name, password=pw)
    yield user, name, pw
    user.delete()


@pytest.fixture
def auth_client(auth_user, client):
    user, name, pw = auth_user
    success = client.login(username=name, password=pw)
    assert success
    yield client
    client.logout()


def test_add_single_record_preexisting(auth_client, records, collections):
    record = records.first()
    collection = collections.first()
    payload = {
        'records': [{'uri': record.uri, 'content': record.content}],
        'collections': [collection.pk]
    }
    response = auth_client.post('/vre/api/add-selection/',
        data=json.dumps(payload),
        content_type='application/json',
    )
    assert response.status_code is 200
    assert response.json() == {collection.description: 1}
    assert record.collection.get(pk=collection.pk)


def test_add_multi_record_multi_collection(auth_client, records, collections):
    # We're going to add two records to two collections:
    # one pre-existing record,
    record1 = records.first()
    # and one to be created on the fly.
    record2 = {'uri': 'http://testing.test/3', 'content': {}}
    payload = {
        'records': [{'uri': record1.uri, 'content': record1.content}, record2],
        'collections': [collection.pk for collection in collections.all()]
    }
    response = auth_client.post('/vre/api/add-selection/',
        data=json.dumps(payload),
        content_type='application/json',
    )
    assert response.status_code is 200
    assert response.json() == {
        collection.description: 2
        for collection in collections.all()
    }
    record2_saved = records.get(uri='http://testing.test/3')
    assert record2_saved
    for collection in collections.all():
        assert record1.collection.get(pk=collection.pk)
        assert record2_saved.collection.get(pk=collection.pk)
