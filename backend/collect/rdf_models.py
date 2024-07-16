from rdflib import RDFS, IdentifiedNode
from typing import Iterable

from triplestore.utils import Triples
from triplestore.constants import EDPOPCOL, AS
from triplestore.rdf_model import RDFModel
from triplestore.rdf_field import RDFField, RDFUniquePropertyField


class CollectionMembersField(RDFField):
    def get(self, instance: RDFModel):
        return [
            s
            for (s, p, o) in self._stored_triples(instance)
        ]


    def _stored_triples(self,instance: RDFModel) -> Triples:
        g = self.get_graph(instance)
        return g.triples((None, RDFS.member, instance.uri))


    def _triples_to_store(self, instance: RDFModel, value: Iterable[IdentifiedNode]) -> Triples:
        return [
            (uri, RDFS.member, instance.uri)
            for uri in value
        ]


class EDPOPCollection(RDFModel):
    '''
    RDF model for EDPOP collections.
    '''
    rdf_class = EDPOPCOL.Collection

    name = RDFUniquePropertyField(AS.name)
    summary = RDFUniquePropertyField(AS.summary)
    project = RDFUniquePropertyField(AS.context)
    records = CollectionMembersField()
