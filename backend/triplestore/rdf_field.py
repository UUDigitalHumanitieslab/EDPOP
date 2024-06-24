'''
Base classes for Django-esque management of RDF data; defines field classes.
'''

from rdflib.term import Identifier, Literal
from rdflib import URIRef, Graph, RDF
from typing import Optional, Dict

from triplestore import utils

class RDFField:
    def get(self, g: Graph, instance):
        '''
        Returns the value currently stored in a graph.

        Parameters:
            g: the graph in which to read data
            instance: the model instance
        '''
        raise NotImplementedError()

    def set(self, g: Graph, instance, value):
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

    def clear(self, g: Graph, instance):
        '''
        Clear the field's data in a graph for a given instance of the model.
        
        This is used as cleanup when deleting the model instance.

        Parameters:
            g: the graph in which to read and store data
            instance: the model instance
        '''
        for triple in self._stored_triples(g, instance):
            g.remove(triple)

    def _stored_triples(self, g: Graph, instance):
        '''
        Extract the set of relevant triples from rom a graph representation
        '''
        raise NotImplementedError()

    def _triples_to_store(self, g: Graph, instance, value):
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
    `PredicateField(B, C)`, the value of the field represents whether the triple
    `(A, B, C)` is present in a graph. The presents of another triple `(A, B, D)` is
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
        if isinstance(node, Literal):
            return node.value
        return node

    def value_to_node(self, value) -> Identifier:
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


class RDFClassField(RDFPredicateField):
    '''
    Field to represent an RDF class.

    This implementation assumes that the class is a constant for the model.
    '''

    def __init__(self, class_uri: URIRef):
        self.class_uri = URIRef
        super().init(RDF.type, class_uri)

    def set(self, g: Graph, instance, value):
        return super().set(g, instance, self.class_uri)
