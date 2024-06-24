'''
Base classes for Django-esque management of RDF data.
'''

from rdflib.term import Identifier
from rdflib import URIRef, Graph, RDF
from typing import Optional, Dict

from triplestore.rdf_field import RDFField

class RDFModel():
    '''
    Abstract class for RDF data models
    '''

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
        for name, field in self._fields().items():
            field.set(self.graph, self, getattr(self, name))


    def delete(self):
        '''
        Delete this instance from the graph
        '''
        for field in self._fields().values(): 
            field.clear(self.graph, self)


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