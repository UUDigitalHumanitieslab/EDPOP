import pytest
from django.contrib.auth.models import User
from rdflib import BNode

from vre.models import ResearchGroup, Collection, Record, Annotation


@pytest.fixture()
def fake_user(db):
    user = User.objects.create()
    return user


@pytest.fixture()
def fake_group(db):
    group = ResearchGroup.objects.create(
        name='test researchers',
        project='test project'
    )
    return group


@pytest.fixture()
def fake_collection(db, fake_group):
    collection = Collection.objects.create(
        description='a collection for testing',
    )
    collection.managing_group.add(fake_group)
    collection.save()
    return collection


@pytest.fixture()
def fake_record(db, fake_collection):
    record = Record.objects.create(
        uri = 'blablablablabla',
        content = {
            'Title': 'Test'
        }
    )
    record.collection.add(fake_collection)
    record.save()
    return record


@pytest.fixture()
def fake_annotation(db, fake_group, fake_record):
    annotation = Annotation.objects.create(
        record = fake_record,
        managing_group = fake_group,
        content = {
            'Title': 'Different kind of test',
            'Genre': 'Test material',
        }
    )
    return annotation

@pytest.fixture()
def property_uris():
    return {
        'Title': BNode(),
        'Author': BNode(),
        'Genre': BNode()
    }