from rdflib import BNode, Graph
from .utils import union_graphs

def blank_triple():
    return (BNode(), BNode(), BNode())

def test_union_graphs():
    g1 = Graph()
    g1.add(blank_triple())

    g2 = Graph()
    g2.add(blank_triple())

    g3 = Graph()
    g3.add(blank_triple())

    result = union_graphs([g1, g2, g3])
    expected = g1 + g2 + g3

    assert set(result) == set(expected)

def test_union_graph_empty():
    union = union_graphs([])
    assert set(union) == set()