from typing import Tuple
from rdflib import Graph, URIRef, BNode, RDF, Literal
from edpop_explorer.readers import HPBReader
from .constants import SKOS


from vre.models import Record
from .constants import EDPOPREC

def legacy_catalog_to_graph() -> Tuple[URIRef, Graph]:
    reader = HPBReader()
    graph = reader.catalog_to_graph()
    subject, _, _ = next(graph.triples((None, RDF.type, None)))
    return subject, graph


def import_record(record: Record, catalog: URIRef) -> Tuple[URIRef, Graph]:
    g = Graph()
    subject = BNode()
    g.add((subject, RDF.type, EDPOPREC.Record))
    g.add((subject, EDPOPREC.fromCatalog, catalog))
    g.add((subject, EDPOPREC.identifier, Literal(record.uri)))
    g.add((subject, EDPOPREC.originalData, Literal(record.content)))

    for (key, value) in record.content.items():
        g += import_field(subject, key, value)

    return subject, g

def import_field(subject: URIRef, key: str, value: str):
    g = Graph()

    property = BNode()
    g.add((property, RDF.type, RDF.Property))
    g.add((property, SKOS.prefLabel, Literal(key)))

    field = BNode()
    g.add((field, RDF.type, EDPOPREC.Field))
    g.add((field, EDPOPREC.originalText, Literal(value)))    

    g.add((subject, property, field))

    return g
