import pytest
from vre.models import Record
from rdflib import RDF
from .constants import EDPOPREC
from .import_legacy_records import import_record, legacy_catalog_to_graph
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
    record, g = import_record(record_obj, catalog)

    assert triple_exists(g, (record, RDF.type, EDPOPREC.Record))