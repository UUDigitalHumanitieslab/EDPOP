from typing import Tuple, List, Dict
from rdflib import Graph, URIRef, BNode, RDF, Literal
from edpop_explorer.readers import HPBReader
from .constants import SKOS
from .utils import ObjectURIs, objects_to_graph

from vre.models import Record
from .constants import EDPOPREC

def known_bibliographical_fields() -> List[URIRef]:
    return [
        EDPOPREC.title,
        EDPOPREC.alternativeTitle,
        EDPOPREC.contributor,
        EDPOPREC.publisherOrPrinter,
        EDPOPREC.placeOfPublication,
        EDPOPREC.dating,
        EDPOPREC.language,
        EDPOPREC.extent,
        EDPOPREC.size,
        EDPOPREC.physicalDescription,
    ]

def legacy_catalog_to_graph() -> Tuple[URIRef, Graph]:
    reader = HPBReader()
    graph = reader.catalog_to_graph()
    subject, _, _ = next(graph.triples((None, RDF.type, None)))
    return subject, graph

def import_properties(keys: List[str]) -> Tuple[ObjectURIs, Graph]:
    identity = lambda key: key
    return objects_to_graph(new_property, identity, set(keys))

def new_property(key: str) -> Tuple[URIRef, Graph]:
    g = Graph()
    property = BNode()
    g.add((property, RDF.type, RDF.Property))
    g.add((property, SKOS.prefLabel, Literal(key)))

    return property, g

def import_record(record: Record, catalog: URIRef, record_properties: ObjectURIs) -> Tuple[URIRef, Graph]:
    g = Graph()
    subject = BNode()
    g.add((subject, RDF.type, EDPOPREC.Record))
    g.add((subject, EDPOPREC.fromCatalog, catalog))
    g.add((subject, EDPOPREC.identifier, Literal(record.uri)))
    g.add((subject, EDPOPREC.originalData, Literal(record.content)))

    for (key, value) in record.content.items():
        property = record_properties[key]
        g += import_field(subject, property, value)

    return subject, g


def import_field(subject: URIRef, property: URIRef, value: str) -> Graph:
    g = Graph()

    field = BNode()
    g.add((field, RDF.type, EDPOPREC.Field))
    g.add((field, EDPOPREC.originalText, Literal(value)))    

    g.add((subject, property, field))

    return g
