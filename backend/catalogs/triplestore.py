"""Functions that deal with adding and updating catalog records in the
triplestore."""
from django.conf import settings
from edpop_explorer import Record
from rdf.utils import prune_triples
from rdflib import URIRef, Graph
from rdflib.term import Node

from triplestore.utils import replace_blank_node, \
    replace_blank_nodes_in_triples, triples_to_quads

RECORDS_GRAPH_URI = settings.RDF_NAMESPACE_ROOT + "records/"
RECORDS_GRAPH_IDENTIFIER = URIRef(RECORDS_GRAPH_URI)

purge_old_update = '''
with <{records_graph}>
delete {{
  ?r ?p1 ?o1.
  ?f ?p2 ?o2.
}}
where {{
  values ?r {{ {obsolete_records} }}
  ?r ?p1 ?o1;
     ?pt ?f.
  optional {{?f ?p2 ?o2.}}
}}
'''.format


def prune_recursively(graph: Graph, subject: Node):
    """Recursively prune triples """
    related_by_subject = list(graph.triples((subject, None, None)))

    for s, p, o in related_by_subject:
        if isinstance(o, URIRef) and o != s:
            prune_recursively(graph, o)

    prune_triples(graph, related_by_subject)


def remove_from_triplestore(records: list[Record]) -> None:
    """Delete given records from triplestore."""
    store = settings.RDFLIB_STORE
    store.update(purge_old_update(
        records_graph=RECORDS_GRAPH_URI,
        obsolete_records=' '.join(f'<{x.iri}>' for x in records)
    ))
    store.commit()


def save_to_triplestore(content_graph: Graph) -> None:
    """Save the fetched records to triplestore."""
    # Create an empty named graph to provide the right context
    record_graph = Graph(identifier=RECORDS_GRAPH_IDENTIFIER)

    # Get the existing graph from Blazegraph
    store = settings.RDFLIB_STORE

    # Add content_graph to records graph
    # Convert triples to quads to include the named graph
    triples = content_graph.triples((None, None, None))
    triples = replace_blank_nodes_in_triples(triples)
    quads = triples_to_quads(triples, record_graph)
    store.addN(quads)
    store.commit()
