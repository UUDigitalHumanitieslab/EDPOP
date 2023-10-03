from typing import Tuple
from rdflib import Graph, URIRef, BNode
from edpop_explorer.readers import HPBReader

def import_record(uri: str) -> Tuple[URIRef, Graph]:
    reader = HPBReader()

    g = Graph()
    subject = BNode()

    return subject, g