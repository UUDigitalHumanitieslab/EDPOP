from typing import Tuple
from rdflib import RDF, Literal, Graph, URIRef
import pytest
from django.contrib.auth.models import User

from vre.models import ResearchGroup, Collection, Record, Annotation
from .constants import EDPOPCOL, AS
from .utils import find_subject_by_class, triple_exists
from .conversion import project_to_graph, projects_to_graph, collection_to_graph, \
    annotation_to_graph, records_to_graph, collections_to_graph, application_to_graph, \
    users_to_graph

@pytest.fixture()
def fake_group(db):
    group = ResearchGroup.objects.create(
        name='test researchers',
        project='test project'
    )
    return group


def test_add_project_to_graph(fake_group):
    _, g = project_to_graph(fake_group)
    project = find_subject_by_class(g, EDPOPCOL.Project)
    assert project


@pytest.fixture()
def fake_collection(db, fake_group):
    collection = Collection.objects.create(
        description='a collection for testing',
    )
    collection.managing_group.add(fake_group)
    collection.save()
    return collection


def test_add_collection_to_graph(fake_group, fake_collection):
    project_uris, _ = projects_to_graph([fake_group])
    collection_node, g = collection_to_graph(fake_collection, project_uris)
    
    assert triple_exists(g, (None, RDF.type, EDPOPCOL.Collection))

    summary_triple = (collection_node, AS.summary, Literal('a collection for testing'))
    assert triple_exists(g, summary_triple)

    project_node = project_uris[fake_group.id]
    context_triple = (collection_node, AS.context, project_node)
    assert triple_exists(g, context_triple)

@pytest.fixture()
def fake_record(db, fake_collection):
    record = Record.objects.create(
        uri = 'blablablablabla',
        content = { 'content': 'test' }
    )
    record.collection.add(fake_collection)
    record.save()
    return record


@pytest.fixture()
def fake_annotation(db, fake_group, fake_record):
    annotation = Annotation.objects.create(
        record = fake_record,
        managing_group = fake_group,
        content = { 'content':  'test' }
    )
    return annotation


def test_add_annotation_to_graph(fake_group, fake_collection, fake_record, fake_annotation):

    application_uri, _ = application_to_graph()
    project_uris, _ = projects_to_graph([fake_group])
    collection_uris, _ = collections_to_graph([fake_collection], project_uris)
    record_uris, _ = records_to_graph([fake_record], collection_uris)
    
    annotation, g = annotation_to_graph(fake_annotation, application_uri, project_uris, record_uris)

    assert find_subject_by_class(g, EDPOPCOL.Annotation)

    assert triple_exists(g, (annotation, AS.context, None))
    assert triple_exists(g, (annotation, AS.generator, application_uri))


@pytest.fixture()
def fake_user(db):
    user = User.objects.create()
    return user

def test_users_to_graph(fake_user):
    uris, g = users_to_graph([fake_user])

    user_node = uris[fake_user.id]
    assert triple_exists(g, (user_node, RDF.type, EDPOPCOL.User))