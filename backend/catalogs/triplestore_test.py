import pytest
from edpop_explorer import Record, EDPOPREC
from rdflib import Graph, RDF, URIRef

from .graphs_test import MockReader
from .triplestore import save_to_triplestore, remove_from_triplestore


@pytest.fixture
def working_data() -> tuple[list[Record], Graph]:
    """Create some data to work with, as a list of records (needed for
    removal) and as a graph."""
    reader = MockReader()
    reader.fetch(10)
    record0 = reader.records[0]
    record1 = reader.records[1]
    graph = record0.to_graph() + record1.to_graph()
    return [record0, record1], graph


def test_add_and_remove(working_data, triplestore):
    records, graph = working_data
    save_to_triplestore(graph)
    remove_from_triplestore(records)
    assert len(list(triplestore.triples((None, None, None)))) == 0


def test_add_and_partial_remove(working_data, triplestore):
    records, graph = working_data
    save_to_triplestore(graph)
    remove_from_triplestore([records[0]])  # Only remove first record
    remaining_subjects = list(triplestore.subjects(RDF.type, EDPOPREC.Record))
    assert len(remaining_subjects) == 1
    # Remaining subject should be the IRI of the second record
    assert remaining_subjects[0] == URIRef(records[1].iri)


def test_remove_nonexistent_subject(working_data):
    # Removing subjects that don't exist should not cause any problems
    records, _ = working_data
    remove_from_triplestore(records)
