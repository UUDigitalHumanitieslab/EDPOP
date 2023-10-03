from rdflib import Graph, RDF, BNode, Literal, URIRef
from typing import Dict, Iterator, Tuple, Callable
from vre.models import ResearchGroup, Collection, Record, Annotation
from .constants import EDPOPCOL, AS, OA
from django.conf import settings
from django.contrib.auth.models import User
from django.db.models import Model

from .utils import union_graphs

ObjectURIs = Dict[int, URIRef]

# APPLICATION

def application_to_graph() -> Tuple[URIRef, Graph]:
    '''
    Add the EDPOP VRE to the graph
    '''
    
    g = Graph()
    subject = BNode()

    g.add((subject, RDF.type, EDPOPCOL.Application))
    _add_application_name_to_graph(g, subject)    

    return subject, g

def _add_application_name_to_graph(g: Graph, subject: URIRef) -> None:
    name = getattr(settings, 'SITE_NAME', None)
    if name:
        g.add((subject, AS.name, Literal(name)))


# USERS

def users_to_graph(users: Iterator[User]) -> Tuple[ObjectURIs, Graph]:
    return objects_to_graph(user_to_graph, users)
    

def user_to_graph(user: User) -> Tuple[URIRef, Graph]:
    '''
    Add a user to the graph.

    It is up to users whether they want to make their account name public,
    so this just creates a blank node of the User type.
    '''

    g = Graph()
    subject = BNode()
    g.add((subject, RDF.type, EDPOPCOL.User))
    return subject, g


# PROJECTS

def projects_to_graph(research_groups: Iterator[ResearchGroup]) -> Tuple[ObjectURIs, Graph]:
    '''
    Convert research groups / projects to RDF representation

    The old database has project as a property of research groups, the RDF graph uses "project"
    as the central term because the relationship with user groups is less strict.
    '''

    return objects_to_graph(project_to_graph, research_groups)


def project_to_graph(research_group: ResearchGroup) -> Tuple[URIRef, Graph]:
    g = Graph()
    subject = BNode()

    g.add((subject, RDF.type, EDPOPCOL.Project))
    _add_project_name_to_graph(research_group, g, subject)

    return subject, g


def _add_project_name_to_graph(research_group: ResearchGroup, g: Graph, subject: URIRef) -> None:
    name = Literal(research_group.project)
    g.add((subject, AS.name, name))


# COLLECTIONS

def collections_to_graph(collections: Iterator[Collection], project_uris: ObjectURIs) -> Tuple[ObjectURIs, Graph]:
    '''
    Convert collections to RDF representation
    '''
    convert = lambda collection: collection_to_graph(collection, project_uris)
    return objects_to_graph(convert, collections)

def collection_to_graph(collection: Collection, project_uris: ObjectURIs) -> Tuple[URIRef, Graph]:
    g = Graph()
    subject = BNode()
    g.add((subject, RDF.type, EDPOPCOL.Collection))

    _add_collection_description_to_graph(collection, g, subject)
    _add_collection_projects_to_graph(collection, g, subject, project_uris)

    return subject, g


def _add_collection_description_to_graph(collection: Collection, g: Graph, subject: URIRef) -> None:
    if collection.description:
        description = Literal(collection.description)
        g.add((subject, AS.summary, description))


def _add_collection_projects_to_graph(collection: Collection, g: Graph, subject: URIRef, project_uris: ObjectURIs) -> None:
    for group in collection.managing_group.all():
        project_uri = project_uris.get(group.id)
        g.add((subject, AS.context, project_uri))


# RECORDS

def records_to_graph(records: Iterator[Record], collection_uris: ObjectURIs) -> Tuple[ObjectURIs, Graph]:
    '''
    Convert records to RDF representation
    '''
    convert = lambda record: record_to_graph(record, collection_uris)
    return objects_to_graph(convert, records)


def record_to_graph(record: Record, collection_uris: ObjectURIs) -> Tuple[URIRef, Graph]:
    g = Graph()
    subject = BNode()

    _add_record_collections_to_graph(record, g, subject, collection_uris)

    return subject, g


def _add_record_collections_to_graph(record: Record, g: Graph, subject: URIRef, collection_uris: ObjectURIs) -> None:
    for collection in record.collection.all():
        collection_uri = collection_uris.get(collection.id)
        g.add((subject, AS.context, collection_uri))


# ANNOTATIONS

def add_annotations_to_graph(annotations: Iterator[Annotation],
                             application_uri: URIRef,
                             project_uris: ObjectURIs,
                             record_uris: ObjectURIs) -> Tuple[ObjectURIs, Graph]:
    '''
    Convert annotations to RDF representation
    '''

    convert = lambda annotation: annotation_to_graph(annotation, application_uri, project_uris, record_uris)
    return objects_to_graph(convert, annotations)


def annotation_to_graph(annotation: Annotation, application_uri: URIRef, project_uris: ObjectURIs, record_uris: ObjectURIs) -> Tuple[URIRef, Graph]:
    g = Graph()
    subject = BNode()
    g.add((subject, RDF.type, EDPOPCOL.Annotation))
    g.add((subject, OA.motivatedBy, OA.editing))
    g.add((subject, AS.generator, application_uri))

    _add_annotation_target_to_graph(annotation, g, subject, record_uris)
    _add_annotation_context_to_graph(annotation, g, subject, project_uris)

    return subject, g


def _add_annotation_target_to_graph(annotation: Annotation, g: Graph, subject: URIRef, record_uris: ObjectURIs) -> URIRef:
    record = record_uris[annotation.record.id]
    g.add((subject, OA.hasTarget, record))


def _add_annotation_context_to_graph(annotation: Annotation, g: Graph, subject: URIRef, project_uris: ObjectURIs) -> None:
    project = project_uris[annotation.managing_group.id]
    g.add((subject, AS.context, project))


# UTILITY

def objects_to_graph(convert: Callable, objects: Iterator[Model]) -> Tuple[ObjectURIs, Graph]:
    '''
    Convert a list of database objects to a graph and a dict with URI references.

    Arguments:
    - `objects`: a list of django model instances
    - `convert`: a function that convert a model instance to a graph. It should return a tuple
    of the subject node for the object, and the graph it has created.

    Returns:
    A tuple of
    - object URIs: a dict that maps object `id`s to their URI
    - a graph containing the representation of all objects
    '''
    
    objects = list(objects)
    result = map(convert, objects)
    uris, graphs = zip(*result)
    object_uris = {
        obj.id: uri
        for obj, uri in zip(objects, uris)
    }
    g = union_graphs(graphs)
    return object_uris, g
