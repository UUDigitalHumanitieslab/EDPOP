import pytest
from rdflib import URIRef, RDF, RDFS
from django.conf import settings

from triplestore.constants import AS, EDPOPCOL
from projects.models import Project
from projects.rdf_models import RDFProject
from collect.rdf_models import EDPOPCollection

@pytest.fixture()
def project(db):
    project = Project.objects.create(name='test', display_name='Test')
    rdf_project = RDFProject(project.graph(), project.identifier())
    return rdf_project

def test_collection_model(project):
    uri = URIRef('test-collection', base='https://test.org/collections/')

    collection = EDPOPCollection(project.graph, uri)
    collection.name = 'Test collection'
    collection.projects = [project]
    collection.records = [
        URIRef('https://example.org/example1'),
        URIRef('https://example.org/example2')
    ]
    collection.save()

    store = settings.RDFLIB_STORE

    assert any(store.triples((collection.uri, RDF.type, EDPOPCOL.Collection)))
    assert any(store.triples((collection.uri, AS.context, project.uri)))
    assert any(store.triples((None, RDFS.member, collection.uri)))

    collection.delete()

    assert not any(store.triples((collection.uri, RDF.type, EDPOPCOL.Collection)))
    assert not any(store.triples((collection.uri, AS.context, project.uri)))
    assert not any(store.triples((None, RDFS.member, collection.uri)))
