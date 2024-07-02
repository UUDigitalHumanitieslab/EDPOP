from rdflib import Graph, RDFS, IdentifiedNode
from typing import Iterable

from triplestore.utils import Triples
from triplestore.constants import EDPOPCOL, AS
from triplestore.rdf_model import RDFModel
from triplestore.rdf_field import RDFField, RDFUniquePropertyField


class CollectionMembersField(RDFField):
    def get(self, graph: Graph, instance: RDFModel):
        return [
            s
            for (s, p, o) in self._stored_triples(graph, instance)
        ]


    def _stored_triples(self, g: Graph, instance: RDFModel) -> Triples:
        return g.triples((None, RDFS.member, instance.uri))


    def _triples_to_store(self, g: Graph, instance: RDFModel, value: Iterable[IdentifiedNode]) -> Triples:
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
