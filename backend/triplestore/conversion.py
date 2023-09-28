from rdflib import Graph, RDF, BNode, Literal, URIRef
from typing import Dict, Iterator
from vre.models import ResearchGroup, Collection
from .constants import EDPOPCOL, AS

ObjectURIs = Dict[int, URIRef]

# PROJECTS

def add_projects_to_graph(research_groups: Iterator[ResearchGroup], g: Graph) -> ObjectURIs:
    return {
        group.id: add_project_to_graph(group, g)
        for group in research_groups
    }


def add_project_to_graph(research_group: ResearchGroup, g: Graph) -> URIRef:
    subject = BNode()

    g.add((subject, RDF.type, EDPOPCOL.Project))
    _add_project_name_to_graph(research_group, g, subject)

    return subject


def _add_project_name_to_graph(research_group: ResearchGroup, g: Graph, subject: URIRef) -> None:
    name = Literal(research_group.project)
    g.add((subject, AS.name, name))


# COLLECTIONS

def add_collections_to_graph(collections: Iterator[Collection], g: Graph, project_uris: ObjectURIs) -> ObjectURIs:
    return {
        collection.id: add_collection_to_graph(collections, g, project_uris)
        for collection in collections
    }


def add_collection_to_graph(collection: Collection, g: Graph, project_uris: ObjectURIs) -> URIRef:
    subject = BNode()

    g.add((subject, RDF.type, EDPOPCOL.Collection))

    _add_collection_description_to_graph(collection, g, subject)
    _add_collection_projects_to_graph(collection, g, subject, project_uris)

    return subject


def _add_collection_description_to_graph(collection: Collection, g: Graph, subject: URIRef) -> None:
    if collection.description:
        description = Literal(collection.description)
        g.add((subject, AS.summary, description))


def _add_collection_projects_to_graph(collection: Collection, g: Graph, subject: URIRef, project_uris: ObjectURIs) -> None:
    for group in collection.managing_group.all():
        project_uri = project_uris.get(group.id, None)

        if project_uri:
            g.add((subject, AS.context, project_uri))
