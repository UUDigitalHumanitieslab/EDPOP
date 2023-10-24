from rdflib import BNode
import pytest

from .annotation_body import annotation_body_to_graph, _replaced_labels
from triplestore.utils import find_subject_by_class
from triplestore.constants import EDPOPCOL



def test_annotation_body_to_graph(fake_annotation, property_uris):
    annotation_uri = BNode()

    g = annotation_body_to_graph(fake_annotation, annotation_uri, property_uris)
    assert g

    body = find_subject_by_class(g, EDPOPCOL.AnnotationBody)
    additions = list(g.objects(body, EDPOPCOL.suggestsAddition))
    removals = list(g.objects(body, EDPOPCOL.suggestsRemoval))

    assert len(additions) == 2
    assert len(removals) == 1

def test_replaced_labels():
    replaced = _replaced_labels(
        {'a': '1', 'b': '2'},
        {'b': '3', 'c': '4'}
    )

    assert replaced == {'b'}