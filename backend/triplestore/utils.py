from typing import Iterator, Tuple, Callable, Dict, Any
from rdflib import Graph, URIRef, RDF
from functools import reduce

def union_graphs(graphs: Iterator[Graph]) -> Graph:
    '''
    Return the union of a collection of graphs

    `union_graphs([g1, g2, g3])` is equivalent to `g1 + g2 + g3` 
    '''
    return reduce(Graph.__iadd__, graphs, Graph())


def triple_exists(graph: Graph, triple: Tuple[URIRef]) -> bool:
    '''
    Check whether a triple exists in a graph.
    '''
    return any(graph.triples(triple))


def find_subject_by_class(graph: Graph, rdf_class: URIRef) -> URIRef:
    '''
    Search a graph and return the first subject with a particular class.

    Returns `None` if no match exists.
    '''
    
    subjects = graph.subjects(RDF.type, rdf_class)
    return next(subjects, None)

ObjectURIs = Dict[int, URIRef]

def objects_to_graph(convert: Callable, to_key: Callable, objects: Iterator[Any]) -> Tuple[ObjectURIs, Graph]:
    '''
    Convert a list of objects to a graph and a dict with URI references.

    Arguments:
    - `convert`: a function that convert an object to a graph. It should return a tuple
    of the subject node for the object, and the graph it has created.
    - `to_id`: a function that transforms an object to a key that can be used to look up its URI in a dict.
    - `objects`: a list of objects to be converted.
    
    Returns:
    A tuple of
    - object URIs: a dict that maps objects to their URI
    - a graph containing the representation of all objects
    '''
    
    objects = list(objects)
    result = map(convert, objects)
    uris, graphs = zip(*result)
    object_uris = {
        to_key(obj): uri
        for obj, uri in zip(objects, uris)
    }
    g = union_graphs(graphs)
    return object_uris, g
