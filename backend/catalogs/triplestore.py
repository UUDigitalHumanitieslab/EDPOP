"""Functions that deal with adding and updating catalog records in the triplestore."""
from django.conf import settings
from edpop_explorer import Record
from rdf.utils import prune_triples
from rdflib import URIRef, Graph

from triplestore.utils import replace_blank_node

RECORDS_GRAPH_IDENTIFIER = URIRef(settings.RDF_NAMESPACE_ROOT + "records/")


def prune_recursively(cls, graph: Graph, subject):
    related_by_subject = list(graph.triples((subject, None, None)))

    for s, p, o in related_by_subject:
        if isinstance(o, URIRef) and o != s:
            cls._prune_recursively(graph, o)

    prune_triples(graph, related_by_subject)


def remove_from_triplestore(records: list[Record]) -> None:
    """Delete given records from triplestore."""
    # TODO: check c
    store = settings.RDFLIB_STORE
    bggraph = Graph(store=store, identifier=RECORDS_GRAPH_IDENTIFIER)
    subject_nodes_to_prune = [URIRef(x.iri) for x in records]
    for s in subject_nodes_to_prune:
        prune_recursively(bggraph, s)


def save_to_triplestore(content_graph: Graph) -> None:
    """Save the fetched records to triplestore."""
    # Create an empty named graph to provide the right context
    record_graph = Graph(identifier=RECORDS_GRAPH_IDENTIFIER)

    # Get the existing graph from Blazegraph
    store = settings.RDFLIB_STORE

    # Add content_graph to records graph
    # Convert triples to quads to include the named graph
    triples = content_graph.triples((None, None, None))
    quads = [
        (replace_blank_node(s),
         replace_blank_node(p),
         replace_blank_node(o),
         record_graph) for (s, p, o) in triples
    ]
    store.addN(quads)