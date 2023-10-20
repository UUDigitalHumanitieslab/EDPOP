from rdflib import URIRef, Graph, BNode, RDF
from typing import Tuple

from vre.models import Annotation
from triplestore.constants import OA, EDPOPCOL

def annotation_body_to_graph(annotation: Annotation, annotation_uri: URIRef) -> Graph:
    body, g = _blank_body(annotation_uri)
    return g

def _blank_body(annotation_uri) -> Tuple[URIRef, Graph]:
    g = Graph()

    body = BNode()
    g.add((annotation_uri, OA.hasBody, body))
    g.add((body, RDF.type, EDPOPCOL.AnnotationBody))

    return body, g