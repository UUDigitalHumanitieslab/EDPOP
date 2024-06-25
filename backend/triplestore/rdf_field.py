'''
Base classes for Django-esque management of RDF data; defines field classes.
'''

from rdflib.term import Identifier, Literal
from rdflib import URIRef, Graph
from typing import Optional

from triplestore import utils

class RDFField:
    '''
    Abstract class for RDF fields.

    A subclass of RDFField must implement how the field represents values in a graph and
    in the Python object. This can be a single triple or a complex structure.

    In most cases, a subclass should implement the following methods:
    - `__init__`: optional, can be used to set any parameters that apply.
    - `get`: takes a graph as input and returns the modelled value of the field.
    - `_stored_triples`: takes a graph as input and returns the scope of the field; that
        is, a subset of the graph that the field is modelling.
    - `_triples_to_store`: returns a collection of triples that represents the modelled
        value.
    
    An `RDFModel` will use the `get`, `set`, and `clear` endpoints. `set` and `clear` have
    default implementations based on `_stored_triples` and `_triples_to_store`.
    Alternatively, you could implement `set` and `clear` directly; in that case, it's not
    necessary to implement `_stored_triples` and `_triples_to_store`.
    '''
    
    def get(self, g: Graph, instance):
        '''
        Returns the value currently stored in a graph.

        Parameters:
            g: the graph in which to read data
            instance: the model instance
        '''
        raise NotImplementedError()

    def set(self, g: Graph, instance, value) -> None:
        '''
        Store a value for the field in a graph

        Parameters:
            g: the graph in which to read and store data
            instance: the model instance
            value: the value of the field on the model instance
        '''
        utils.replace_triples(
            g,
            self._stored_triples(g, instance),
            self._triples_to_store(g, instance, value)
        )

    def clear(self, g: Graph, instance) -> None:
        '''
        Clear the field's data in a graph for a given instance of the model.
        
        This is used as cleanup when deleting the model instance.

        Parameters:
            g: the graph in which to read and store data
            instance: the model instance
        '''
        for triple in self._stored_triples(g, instance):
            g.remove(triple)

    def _stored_triples(self, g: Graph, instance) -> utils.Triples:
        '''
        Extract the set of relevant triples from a graph representation
        '''
        raise NotImplementedError()

    def _triples_to_store(self, g: Graph, instance, value) -> utils.Triples:
        '''
        Triples that should be stored to represent the modelled value
        '''
        raise NotImplementedError()


class RDFPredicateField(RDFField):
    '''
    Models a predicate, i.e. a property + object in the graph. This translates to a
    boolean value in the model.

    Note that unlike the RDFPropertyField (and derivatives), this field does not model all
    triples with the provided property. That is, if `A` is an instance of a model with
    `RDFPredicateField(B, C)`, the value of the field represents whether the triple
    `(A, B, C)` is present in a graph. The presence of another triple `(A, B, D)` is
    considered irrelevant, and will not be affected when you save the field.
    '''

    def __init__(self, property: URIRef, object: Identifier):
        self.property = property
        self.object = object

    def get(self, g: Graph, instance):
        return any(self._stored_triples(g, instance))

    def _stored_triples(self, g: Graph, instance):
        subject = instance.uri
        return g.triples((subject, self.property, self.object))
    
    def _triples_to_store(self, g: Graph, instance, value):
        if value:
            subject = instance.uri
            return [(subject, self.property, self.object)]
        else:
            return []

class RDFPropertyField(RDFField):
    '''
    Models a property relationship. For a given subject, this field represents all triples
    (s, p, o), where s is the node represented by the model instance, and p is the field's
    configured property.
    '''

    def __init__(self, property: URIRef):
        self.property = property

    def get(self, g: Graph, instance):
        return [
            self.node_to_value(o)
            for (s, p, o) in self._stored_triples(g, instance)
        ]

    def node_to_value(self, node: Identifier):
        '''
        Convert an object node to its modelled value
        '''
        if isinstance(node, Literal):
            return node.value
        return node

    def value_to_node(self, value) -> Identifier:
        '''
        Convert a modelled value to an object identifier.
        '''
        if isinstance(value, Identifier):
            return value
        else:
            return Literal(value)

    def _stored_triples(self, g: Graph, instance):
        subject = instance.uri
        return g.triples((subject, self.property, None))

    def _triples_to_store(self, g: Graph, instance, value):
        subject = instance.uri
        return [(subject, self.property, self.value_to_node(o)) for o in value]


class RDFUniquePropertyField(RDFPropertyField):
    '''
    Like RDFProperty, but when the property is always unique for the subject.
    '''

    def get(self, g: Graph, instance):
        values = super().get(g, instance)
        if len(values):
            return values[0]


    def set(self, g: Graph, instance, object: Optional[Identifier]):
        return super().set(g, instance, [object])
