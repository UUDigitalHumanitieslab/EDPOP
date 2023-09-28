from typing import Tuple
from rdflib import RDF, Literal, Graph, URIRef
import pytest

from vre.models import ResearchGroup, Collection
from .constants import EDPOPCOL, AS
from .conversion import add_project_to_graph, add_projects_to_graph, add_collection_to_graph

def triple_exists(graph: Graph, triple: Tuple[URIRef]):
    return any(graph.triples(triple))


def find_subject_by_class(graph: Graph, rdf_class: URIRef):
    subjects = graph.subjects(RDF.type, rdf_class)
    return next(subjects, None)


@pytest.fixture()
def fake_group(db):
    group = ResearchGroup.objects.create(
        name='test researchers',
        project='test project'
    )
    return group


def test_add_project_to_graph(fake_group, empty_graph):
    g = empty_graph
    add_project_to_graph(fake_group, g)

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


def test_add_collection_to_graph(fake_group, fake_collection, empty_graph):
    g = empty_graph

    project_uris = add_projects_to_graph([fake_group], g)
    collection_node = add_collection_to_graph(fake_collection, g, project_uris)
    
    assert triple_exists(g, (None, RDF.type, EDPOPCOL.Collection))

    summary_triple = (collection_node, AS.summary, Literal('a collection for testing'))
    assert triple_exists(g, summary_triple)

    project_node = project_uris[fake_group.id]
    context_triple = (collection_node, AS.context, project_node)
    assert triple_exists(g, context_triple)