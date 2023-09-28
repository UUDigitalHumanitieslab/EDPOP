from rdflib import Graph, RDF, BNode, Literal, URIRef
from typing import Dict
from vre.models import ResearchGroup, Collection
from .constants import EDPOPCOL, AS

ObjectURIs = Dict[str, URIRef]

# PROJECTS

def add_project_to_graph(research_group: ResearchGroup, g: Graph):
    subject = BNode()

    g.add((subject, RDF.type, EDPOPCOL.Project))
    _add_project_name_to_graph(research_group, g, subject)

    return subject

def _add_project_name_to_graph(research_group: ResearchGroup, g: Graph, subject: URIRef):
    name = Literal(research_group.project)
    g.add((subject, AS.name, name))

# COLLECTIONS

def add_collection_to_graph(collection: Collection, g: Graph, project_uris: ObjectURIs):
    subject = BNode()

    g.add((subject, RDF.type, EDPOPCOL.Collection))

    _add_collection_description_to_graph(collection, g, subject)
    _add_collection_projects_to_graph(collection, g, subject, project_uris)

    return subject

def _add_collection_description_to_graph(collection: Collection, g: Graph, subject: URIRef):
    if collection.description:
        description = Literal(collection.description)
        g.add((subject, AS.summary, description))

def _add_collection_projects_to_graph(collection: Collection, g: Graph, subject: URIRef, project_uris: ObjectURIs):
    for group in collection.managing_group.all():
        project_uri = project_uris.get(group.id, None)

        if project_uri:
            g.add((subject, AS.context, project_uri))

# CONTAINER CLASS

class RDFConverter:

    def __init__(self, graph: Graph):
        self.graph = graph
    
    def add_project(self, research_group: ResearchGroup):
        subject = add_project_to_graph(research_group, self.graph)
