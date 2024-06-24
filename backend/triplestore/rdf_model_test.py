from rdflib import URIRef, Literal
from triplestore.constants import AS
from triplestore.rdf_field import RDFUniquePropertyField
from triplestore.rdf_model import RDFModel
from triplestore.utils import triple_exists

class Example(RDFModel):
    name = RDFUniquePropertyField(AS.name)

def test_rdf_model(empty_graph):
    g = empty_graph
    uri = URIRef('example', 'https://example.org/')
    example = Example(g, uri)

    assert example.name == None # no name in the graph

    example.name = Literal('Test')
    example.save()

    assert triple_exists(g, (uri, AS.name, Literal('Test')))

    example.delete()

    assert not triple_exists(g, (uri, AS.name, Literal('Test')))
