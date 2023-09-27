from rdflib import Graph, RDF, BNode, Literal

from vre.models import ResearchGroup, Collection
from .constants import EDPOPCOL, AS

def add_project_to_graph(research_group: ResearchGroup, g: Graph):
    subject = BNode()

    g.add((subject, RDF.type, EDPOPCOL.Project))

    name = Literal(research_group.project)
    g.add((subject, AS.name, name))

def add_collection_to_graph(collection: Collection, g: Graph):
    subject = BNode()

    g.add((subject, RDF.type, EDPOPCOL.Collection))

    if collection.description:
        description = Literal(collection.description)
        g.add((subject, AS.summary, description))

    for group in collection.managing_group.all():
        pass

    return g
