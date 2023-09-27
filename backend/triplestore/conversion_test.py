from typing import Tuple
from rdflib import RDF, Literal, Graph, URIRef

from vre.models import Collection
from .constants import EDPOPCOL, AS
from .conversion import add_collection_to_graph

def triple_exists(graph: Graph, triple: Tuple[URIRef]):
    return any(graph.triples(triple))

def test_add_collection_to_graph(empty_graph):
    g = empty_graph

    collection = Collection(
        description = 'a collection for testing'
    )

    add_collection_to_graph(collection, g)
    
    assert triple_exists(g, (None, RDF.type, EDPOPCOL.Collection))

    collection, _, _ = next(g.triples((None, RDF.type, EDPOPCOL.Collection)))

    summary_triple = (collection, AS.summary, Literal('a collection for testing'))
    assert triple_exists(g, summary_triple)