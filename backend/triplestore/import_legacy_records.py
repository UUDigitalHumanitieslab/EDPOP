from typing import Tuple
from rdflib import Graph, URIRef, BNode, RDF
from edpop_explorer.readers import HPBReader

from vre.models import Record
from .constants import EDPOPREC

def legacy_catalog_to_graph() -> Tuple[URIRef, Graph]:
    reader = HPBReader()
    graph = reader.catalog_to_graph()
    subject, _, _ = next(graph.triples((None, RDF.type, None)))
    return subject, graph


def import_record(record: Record, catalog: URIRef) -> Tuple[URIRef, Graph]:
    reader = HPBReader()

    g = Graph()

    subject = BNode()
    g.add((subject, RDF.type, EDPOPREC.Record))
    g.add((subject, EDPOPREC.fromCatalog, catalog))

    return subject, g