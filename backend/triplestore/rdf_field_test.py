from rdflib import Literal, BNode, Namespace
from rdflib.term import Identifier
from triplestore.rdf_model import RDFModel
from triplestore.rdf_field import RDFPredicateField, RDFPropertyField
from triplestore.utils import triple_exists

Test = Namespace('https://www.test.org/test#')

class LuckyNumbers(RDFPropertyField):
    def __init__(self):
        super().__init__(Test.luckyNumber)
    
    def node_to_value(self, node: Literal):
        return node.value

    def value_to_node(self, value) -> Identifier:
        return Literal(value)


class Example(RDFModel):
    named_bob = RDFPredicateField(Test.name, Literal('Bob'))
    lucky_numbers = LuckyNumbers()


def test_predicate_field(empty_graph):
    g = empty_graph
    instance = Example(g, BNode())

    assert Example.named_bob.get(g, instance) == False
    
    Example.named_bob.set(g, instance, True)
    assert triple_exists(g, (instance.uri, Test.name, Literal('Bob')))

    Example.named_bob.clear(g, instance)
    assert not triple_exists(g, (instance.uri, Test.name, Literal('Bob')))

def test_property_field(empty_graph):
    g = empty_graph
    instance = Example(g, BNode())

    assert Example.lucky_numbers.get(g, instance) == []

    g.add((instance.uri, Test.luckyNumber, Literal(13)))
    assert Example.lucky_numbers.get(g, instance) == [13]

    Example.lucky_numbers.set(g, instance, [7, 15])
    assert triple_exists(g, (instance.uri, Test.luckyNumber, Literal(7)))
    assert triple_exists(g, (instance.uri, Test.luckyNumber, Literal(15)))

    Example.lucky_numbers.clear(g, instance)
    assert not triple_exists(g, (instance.uri, Test.luckyNumber, None))
