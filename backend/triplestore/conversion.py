from rdflib import Graph, RDF, BNode, Literal

from vre.models import Collection
from .constants import EDPOPCOL, AS

def collection_to_graph(collection: Collection):
    g = Graph()

    subject = BNode()

    g.add((subject, RDF.type, EDPOPCOL.Collection))

    if collection.description:
        description = Literal(collection.description)
        g.add((subject, AS.summary, description))

    return g