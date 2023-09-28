from rdflib import Graph, RDF, BNode, Literal, URIRef
from typing import Dict, Iterator
from vre.models import ResearchGroup, Collection, Record, Annotation
from .constants import EDPOPCOL, AS, OA
from django.conf import settings

ObjectURIs = Dict[int, URIRef]

# APPLICATION

def add_application_to_graph(g: Graph) -> URIRef:
    subject = BNode()

    g.add((subject, RDF.type, EDPOPCOL.Application))
    _add_application_name_to_graph(g, subject)    

    return subject

def _add_application_name_to_graph(g: Graph, subject: URIRef) -> None:
    name = getattr(settings, 'SITE_NAME', None)
    if name:
        g.add((subject, AS.name, Literal(name)))

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
        collection.id: add_collection_to_graph(collection, g, project_uris)
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
        project_uri = project_uris.get(group.id)
        g.add((subject, AS.context, project_uri))


# RECORDS

def add_records_to_graph(records: Iterator[Record], g: Graph, collection_uris: ObjectURIs) -> ObjectURIs:
    return {
        record.id: add_record_to_graph(record, g, collection_uris)
        for record in records
    }


def add_record_to_graph(record: Record, g: Graph, collection_uris: ObjectURIs) -> URIRef:
    subject = BNode()

    _add_record_collections_to_graph(record, g, subject, collection_uris)

    return subject


def _add_record_collections_to_graph(record: Record, g: Graph, subject: URIRef, collection_uris: ObjectURIs) -> None:
    for collection in record.collection.all():
        collection_uri = collection_uris.get(collection.id)
        g.add((subject, AS.context, collection_uri))


# ANNOTATIONS

def add_annotation_to_graph(annotation: Annotation, g: Graph, application_uri: URIRef, project_uris: ObjectURIs, record_uris: ObjectURIs) -> URIRef:
    subject = BNode()
    g.add((subject, RDF.type, EDPOPCOL.Annotation))
    g.add((subject, OA.motivatedBy, OA.editing))
    g.add((subject, AS.generator, application_uri))

    _add_annotation_target_to_graph(annotation, g, subject, record_uris)
    _add_annotation_context_to_graph(annotation, g, subject, project_uris)

    return subject


def _add_annotation_target_to_graph(annotation: Annotation, g: Graph, subject: URIRef, record_uris: ObjectURIs) -> URIRef:
    record = record_uris[annotation.record.id]
    g.add((subject, OA.hasTarget, record))


def _add_annotation_context_to_graph(annotation: Annotation, g: Graph, subject: URIRef, project_uris: ObjectURIs) -> None:
    project = project_uris[annotation.managing_group.id]
    g.add((subject, AS.context, project))
