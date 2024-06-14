from rdflib import RDF
from triplestore.constants import EDPOPCOL

from project.models import Project

def new_project_graph(project: Project):
    g = project.graph()
    subject = project.identifier()
    g.add((subject, RDF.type, EDPOPCOL.Project))
    return g