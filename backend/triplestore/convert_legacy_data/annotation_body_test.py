from rdflib import BNode
import pytest

from .annotation_body import annotation_body_to_graph
from triplestore.utils import find_subject_by_class, triple_exists
from triplestore.constants import EDPOPCOL



def test_annotation_body_to_graph(fake_annotation, property_uris):
    annotation_uri = BNode()

    g = annotation_body_to_graph(fake_annotation, annotation_uri, property_uris)
    assert g

    body = find_subject_by_class(g, EDPOPCOL.AnnotationBody)
    assert triple_exists(g, (body, EDPOPCOL.suggestsAddition, None))