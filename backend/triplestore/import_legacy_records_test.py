import pytest
from vre.models import Record
from rdflib import RDF, Graph
from .constants import EDPOPREC
from .import_legacy_records import import_record, legacy_catalog_to_graph, import_properties
from .utils import triple_exists

@pytest.fixture()
def record_obj(db):
    data = {
        'Title': 'Testing',
        'Author': 'Tester Testington'
    }

    return Record.objects.create(
        uri='http://test.test/test',
        content=data
    )

def test_import_record(record_obj):
    catalog, _ = legacy_catalog_to_graph()
    property_uris, _ = import_properties(['Title', 'Author'])
    record, g = import_record(record_obj, catalog, property_uris)

    assert triple_exists(g, (record, RDF.type, EDPOPREC.Record))

def test_import_properties():
    g = Graph()

    properties = ['Title', 'Author', 'Title', 'Date']

    uris, graph = import_properties(properties)

    assert all(p in uris for p in properties)

    properties_in_graph = graph.triples((None, RDF.type, RDF.Property))
    assert len(list(properties_in_graph)) == 3

    
