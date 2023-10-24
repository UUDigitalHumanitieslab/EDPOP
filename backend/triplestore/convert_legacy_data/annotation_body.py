from rdflib import URIRef, Graph, BNode, RDF
from typing import Tuple, Dict, Set

from vre.models import Annotation
from triplestore.constants import OA, EDPOPCOL
from triplestore.utils import ObjectURIs
from .import_legacy_records import field_to_graph

def annotation_body_to_graph(annotation: Annotation, annotation_uri: URIRef, property_uris: ObjectURIs) -> Graph:
    body, g = _blank_body(annotation_uri)
    g += _additions_to_graph(annotation.content, body, property_uris)
    g += _removals_to_graph(annotation.content, annotation.record.content, body, property_uris)
    return g

def _blank_body(annotation_uri) -> Tuple[URIRef, Graph]:
    g = Graph()

    body = BNode()
    g.add((annotation_uri, OA.hasBody, body))
    g.add((body, RDF.type, EDPOPCOL.AnnotationBody))

    return body, g

def _additions_to_graph(annotation_content: Dict[str, str], body: URIRef, property_uris: ObjectURIs) -> Graph:
    g = Graph()
    for (key, value) in annotation_content.items():
        field, field_graph = field_to_graph(value)
        predicate, predicate_graph = _annotation_item_to_graph(key, field, property_uris)
        g += field_graph
        g += predicate_graph
        g.add((body, EDPOPCOL.suggestsAddition, predicate))

    return g

def _removals_to_graph(annotation_content: Dict[str, str], record_content: Dict[str, str], body: URIRef, property_uris: ObjectURIs) -> Graph:
    g = Graph()

    for label in _replaced_labels(annotation_content, record_content):
        field = BNode() # TODO get current field
        predicate, predicate_graph = _annotation_item_to_graph(label, field, property_uris)
        g += predicate_graph
        g.add((body, EDPOPCOL.suggestsRemoval, predicate))

    return g

def _replaced_labels(annotation_content: Dict[str, str], record_content: Dict[str, str]) -> Set[str]:
    annotation_labels = annotation_content.keys()
    record_labels = record_content.keys()
    return set(annotation_labels).intersection(record_labels)

def _annotation_item_to_graph(key: str, field: URIRef, property_uris: ObjectURIs) -> Tuple[URIRef, Graph]:
    g = Graph()

    subject = BNode()
    g.add((subject, RDF.type, EDPOPCOL.Predicate))

    property = property_uris[key]
    g.add((subject, EDPOPCOL.property, property))
    g.add((subject, EDPOPCOL.object, field))

    return subject, g
