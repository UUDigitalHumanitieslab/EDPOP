from rdflib import BNode
import pytest

from .annotation_body import annotation_body_to_graph

@pytest.fixture()
def property_uris():
    return {
        'Title': BNode(),
        'Author': BNode(),
        'Genre': BNode()
    }

def test_annotation_body_to_graph(fake_annotation, property_uris):
    annotation_uri = BNode()

    g = annotation_body_to_graph(fake_annotation, annotation_uri, property_uris)

    assert g