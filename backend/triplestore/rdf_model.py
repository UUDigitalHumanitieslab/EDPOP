'''
Base classes for Django-esque management of RDF data.
'''

from rdflib import URIRef, Graph, RDF
from typing import Dict
from django.conf import settings

from triplestore.rdf_field import RDFField
from triplestore.utils import triples_to_quads

class RDFModel():
    '''
    Abstract class for RDF data models
    '''

    store = settings.RDFLIB_STORE
    rdf_class = None

    def __init__(self, graph: Graph, uri: URIRef):
        self.graph = graph
        self.uri = uri

        for name, field in self._fields().items():
            value = field.get(self.graph, self)
            self.__setattr__(name, value)


    def save(self):
        '''
        Store the data of this instance in the graph
        '''

        self.graph.addN(triples_to_quads(self._class_triples(), self.graph))

        for name, field in self._fields().items():
            field.set(self.graph, self, getattr(self, name))

        self.store.commit()


    def delete(self):
        '''
        Delete this instance from the graph
        '''
        for triple in self._class_triples():
            self.graph.remove(triple)

        for field in self._fields().values(): 
            field.clear(self.graph, self)
        
        self.store.commit()

    def _class_triples(self):
        '''
        A set of triples that is common to all instances of the model.

        The default implementation will add a single triple with the `rdf_class` of the
        model class (if one is configured). You can override this class to use other data.
        '''

        if self.__class__.rdf_class:
            return [(self.uri, RDF.type, self.__class__.rdf_class)]

        return []

    def _fields(self) -> Dict[str, RDFField]:
        '''
        Lists RDFFields of this model.
        '''
        attributes = self.__class__.__dict__
        return {
            attr: item
            for (attr, item) in attributes.items()
            if isinstance(item, RDFField)
        }