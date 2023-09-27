from typing import Tuple
from rdflib import RDF, Literal, Graph, URIRef
import pytest

from vre.models import ResearchGroup, Collection
from .constants import EDPOPCOL, AS
from .conversion import add_project_to_graph, add_collection_to_graph

def triple_exists(graph: Graph, triple: Tuple[URIRef]):
    return any(graph.triples(triple))

def find_triple(graph: Graph, triple: Tuple[URIRef]):
    return next(graph.triples(triple))

def find_subject(graph: Graph, predicate: URIRef, object: URIRef):
    return find_triple(graph, (None, predicate, object))

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

    assert triple_exists(g, (None, RDF.type, EDPOPCOL.Project))

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

    add_project_to_graph(fake_group, g)
    add_collection_to_graph(fake_collection, g)
    
    assert triple_exists(g, (None, RDF.type, EDPOPCOL.Collection))

    collection, _, _ = find_subject(g, RDF.type, EDPOPCOL.Collection)

    summary_triple = (collection, AS.summary, Literal('a collection for testing'))
    assert triple_exists(g, summary_triple)