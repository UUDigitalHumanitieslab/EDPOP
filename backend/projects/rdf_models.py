from rdflib import Graph, IdentifiedNode
from typing import Iterable

from triplestore.constants import AS, EDPOPCOL
from triplestore.rdf_model import RDFModel
from triplestore.rdf_field import RDFUniquePropertyField, RDFField
from triplestore.utils import Triples


class CollectionsField(RDFField):
    def get(self, graph: Graph, instance: RDFModel):
        return [
            s
            for (s, p, o) in self._stored_triples(graph, instance)
        ]

    def _stored_triples(self, g: Graph, instance: RDFModel) -> Triples:
        results = g.query(f'''
        SELECT ?s
        WHERE {{
            ?s  a edpopcol:Collection ;
                as:context <{instance.uri}> .
        }}
        ''', initNs={'as': AS, 'edpopcol': EDPOPCOL})

        return [
            (result, AS.context, instance.uri)
            for (result, ) in results
        ]

    def _triples_to_store(self, g: Graph, instance: RDFModel, value: Iterable[IdentifiedNode]) -> Triples:
        # TODO: also include "a edpopcol:Collection" statement?
        return [
            (uri, AS.context, instance.uri)
            for uri in value
        ]


class RDFProject(RDFModel):
    rdf_class = EDPOPCOL.Project

    name = RDFUniquePropertyField(AS.name)
    summary = RDFUniquePropertyField(AS.summary)

    collections = CollectionsField()