from typing import Iterator, Tuple
from rdflib import Graph, URIRef, RDF
from functools import reduce

def union_graphs(graphs: Iterator[Graph]) -> Graph:
    return reduce(Graph.__iadd__, graphs)


def triple_exists(graph: Graph, triple: Tuple[URIRef]):
    return any(graph.triples(triple))


def find_subject_by_class(graph: Graph, rdf_class: URIRef):
    subjects = graph.subjects(RDF.type, rdf_class)
    return next(subjects, None)

