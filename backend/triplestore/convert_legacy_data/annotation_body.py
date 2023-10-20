from rdflib import URIRef, Graph, BNode, RDF
from typing import Tuple, Dict

from vre.models import Annotation
from triplestore.constants import OA, EDPOPCOL
from triplestore.utils import ObjectURIs
from .import_legacy_records import field_to_graph

def annotation_body_to_graph(annotation: Annotation, annotation_uri: URIRef, property_uris: ObjectURIs) -> Graph:
    body, g = _blank_body(annotation_uri)
    g += _additions_to_graph(annotation.content, body, property_uris)
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
        predicate, predicate_graph = _annotation_item_to_graph(key, value, property_uris)
        g += predicate_graph
        g.add((body, EDPOPCOL.suggestsAddition, predicate))

    return g

def _annotation_item_to_graph(key: str, value: str, property_uris: ObjectURIs) -> Tuple[URIRef, Graph]:
    g = Graph()

    subject = BNode()
    g.add((subject, RDF.type, EDPOPCOL.Predicate))

    property = property_uris[key]
    g.add((subject, EDPOPCOL.property, property))

    field, field_graph = field_to_graph(value)
    g += field_graph
    g.add((subject, EDPOPCOL.object, field))

    return subject, g
