from rdflib import RDF, Literal, BNode

from ..constants import EDPOPCOL, AS
from ..utils import find_subject_by_class, triple_exists
from .conversion import _project_to_graph, projects_to_graph, _collection_to_graph, \
    _annotation_to_graph, records_to_graph, collections_to_graph, application_to_graph, \
    users_to_graph, convert_all

def test_add_project_to_graph(fake_group):
    _, g = _project_to_graph(fake_group)
    project = find_subject_by_class(g, EDPOPCOL.Project)
    assert project


def test_add_collection_to_graph(fake_group, fake_collection):
    project_uris, _ = projects_to_graph([fake_group])
    collection_node, g = _collection_to_graph(fake_collection, project_uris)
    
    assert triple_exists(g, (None, RDF.type, EDPOPCOL.Collection))

    summary_triple = (collection_node, AS.summary, Literal('a collection for testing'))
    assert triple_exists(g, summary_triple)

    project_node = project_uris[fake_group.id]
    context_triple = (collection_node, AS.context, project_node)
    assert triple_exists(g, context_triple)


def test_add_annotation_to_graph(fake_group, fake_collection, fake_record, fake_annotation, property_uris):

    application_uri, _ = application_to_graph()
    project_uris, _ = projects_to_graph([fake_group])
    collection_uris, _ = collections_to_graph([fake_collection], project_uris)
    record_uris, record_graph = records_to_graph([fake_record], collection_uris, property_uris)
    annotation, g = _annotation_to_graph(fake_annotation, application_uri, project_uris, record_uris, property_uris, record_graph)

    assert find_subject_by_class(g, EDPOPCOL.Annotation)

    assert triple_exists(g, (annotation, AS.context, None))
    assert triple_exists(g, (annotation, AS.generator, application_uri))


def test_users_to_graph(fake_user):
    uris, g = users_to_graph([fake_user])

    user_node = uris[fake_user.id]
    assert triple_exists(g, (user_node, RDF.type, EDPOPCOL.User))


def test_convert_all(fake_user, fake_group, fake_collection, fake_record, fake_annotation):
    refs, graph = convert_all(
        [fake_user],
        [fake_group],
        [fake_collection],
        [fake_record],
        [fake_annotation]
    )
    assert graph

