from rdflib import RDF

from vre.models import Collection
from .constants import EDPOPCOL
from .conversion import collection_to_graph

def test_collection_to_graph():
    collection = Collection(
        description = 'a collection for testing'
    )
    g = collection_to_graph(collection)
    
    assert any(g.triples((None, RDF.type, EDPOPCOL.Collection)))
    