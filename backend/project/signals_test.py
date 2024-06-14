from rdflib import RDF
from triplestore.constants import EDPOPCOL
from django.conf import settings
from project.models import Project

def test_project_graph_created_and_deleted(db):
    triplestore = settings.RDFLIB_STORE

    project = Project.objects.create(name='test')

    triple_pattern = (project.identifier(), RDF.type, EDPOPCOL.Project)
    assert any(triplestore.triples(triple_pattern))

    project.delete()
    assert not any(triplestore.triples(triple_pattern))
