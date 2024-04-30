from rdflib import BNode, Graph, URIRef, Literal
from rdflib.namespace import RDF

from .utils import union_graphs, replace_blank_node

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


def test_replace_blank_node_non_blank_equal():
    node = URIRef("http://example.com/uri")
    assert replace_blank_node(node) == node


def test_replace_blank_node():
    graph = Graph()
    bnode = BNode()
    graph.add((bnode, RDF.type, Literal("test")))
    retrieved_bnode, _, _ = next(graph.triples((None, RDF.type, Literal("test"))))
    bnode_converted = replace_blank_node(bnode)
    retrieved_bnode_converted = replace_blank_node(retrieved_bnode)
    assert bnode_converted == retrieved_bnode_converted
