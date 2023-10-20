import pytest
from vre.models import Record
from rdflib import RDF, Graph
from .constants import EDPOPREC
from .import_legacy_records import import_records, import_record, legacy_catalog_to_graph, import_properties, import_property
from .utils import triple_exists
from .record_ontology import import_ontology

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

def test_import_records(record_obj):
    uris, graph = import_records([record_obj])
    assert record_obj.id in uris
    uri = uris[record_obj.id]
    assert triple_exists(graph, (uri, RDF.type, EDPOPREC.Record))

def test_import_record(record_obj):
    catalog, _ = legacy_catalog_to_graph()
    property_uris, _ = import_properties(['Title', 'Author'])
    record, g = import_record(record_obj, catalog, property_uris)

    assert triple_exists(g, (record, RDF.type, EDPOPREC.Record))

def test_import_properties():
    properties = ['Title', 'Author', 'Title', 'Date']
    uris, _ = import_properties(properties)
    assert all(p in uris for p in properties)

@pytest.fixture(scope='session')
def ontology():
    return import_ontology()

def test_import_property(ontology):
    label = 'Title'
    uri, graph = import_property(label, ontology)
    assert uri == EDPOPREC.title
    assert not triple_exists(graph, (None, None, None))

def import_unknown_property(ontology):
    label = 'Special title'
    uri, graph = import_property(label, ontology)
    assert triple_exists(graph, (uri, RDF.type, RDF.Property))
