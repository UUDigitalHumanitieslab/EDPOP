from rdflib import RDF, Literal
from triplestore.constants import EDPOPCOL, AS
from itertools import chain

from project.models import Project

def stored_project_metadata(project: Project):
    '''
    Iterable of project metadata currently in the triplestore.
    '''
    g = project.graph()
    subject = project.identifier()

    type_data = g.triples((subject, RDF.type, None))
    name_data = g.triples((subject, AS.name, None))
    summary_data = g.triples((subject, AS.summary, None))

    return chain(type_data, name_data, summary_data)

def project_metadata_to_graph(project: Project):
    '''
    Graph representation of project metadata.
    '''
    g = project.graph()
    subject = project.identifier()

    g.add((subject, RDF.type, EDPOPCOL.Project))

    g.add((subject, AS.name, Literal(project.display_name)))
    
    if project.summary:
        g.add((subject, AS.summary, Literal(project.summary)))

    return g