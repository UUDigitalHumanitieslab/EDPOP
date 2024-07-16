from rdflib import Literal, BNode, Namespace
from triplestore.rdf_model import RDFModel
from triplestore.rdf_field import (
    RDFPredicateField, RDFPropertyField, RDFUniquePropertyField,
)
from triplestore.utils import triple_exists

Test = Namespace('https://www.test.org/test#')

class Example(RDFModel):
    named_bob = RDFPredicateField(Test.name, Literal('Bob'))
    lucky_numbers = RDFPropertyField(Test.luckyNumber)
    location = RDFUniquePropertyField(Test.location)

def test_predicate_field(empty_graph):
    g = empty_graph
    instance = Example(g, BNode())

    assert Example.named_bob.get(instance) == False
    
    Example.named_bob.set(instance, True)
    assert triple_exists(g, (instance.uri, Test.name, Literal('Bob')))

    Example.named_bob.clear(instance)
    assert not triple_exists(g, (instance.uri, Test.name, Literal('Bob')))

def test_property_field(empty_graph):
    g = empty_graph
    instance = Example(g, BNode())

    assert Example.lucky_numbers.get(instance) == []

    g.add((instance.uri, Test.luckyNumber, Literal(13)))
    assert Example.lucky_numbers.get(instance) == [13]

    Example.lucky_numbers.set(instance, [7, 15])
    assert triple_exists(g, (instance.uri, Test.luckyNumber, Literal(7)))
    assert triple_exists(g, (instance.uri, Test.luckyNumber, Literal(15)))

    Example.lucky_numbers.clear(instance)
    assert not triple_exists(g, (instance.uri, Test.luckyNumber, None))

def test_unique_property_field(empty_graph):
    g = empty_graph
    instance = Example(g, BNode())

    assert Example.location.get(instance) is None

    x = BNode()
    g.add((instance.uri, Test.location, x))
    assert Example.location.get(instance) == x

    y = BNode()
    Example.location.set(instance, y)
    assert not triple_exists(g, (instance.uri, Test.location, x))
    assert triple_exists(g, (instance.uri, Test.location, y))
