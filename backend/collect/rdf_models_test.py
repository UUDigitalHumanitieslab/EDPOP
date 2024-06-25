import pytest
from rdflib import URIRef
from django.conf import settings

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
    collection.save()
