from rdflib import BNode

from .annotation_body import annotation_body_to_graph

def test_annotation_body_to_graph(fake_annotation):
    annotation_uri = BNode()

    g = annotation_body_to_graph(fake_annotation, annotation_uri)

    assert g