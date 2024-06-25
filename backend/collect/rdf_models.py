from rdflib.term import Identifier, IdentifiedNode
from rdflib import Graph, RDFS

from triplestore.utils import Triples
from triplestore.constants import EDPOPCOL, AS, EDPOPREC
from triplestore.rdf_model import RDFModel
from triplestore.rdf_field import RDFField, RDFUniquePropertyField, RDFPropertyField
from projects.rdf_models import RDFProject

# class ProjectContextField(RDFPropertyField):
#     def __init__(self):
#         super().init(AS.context)
    
#     def node_to_value(self, node: Identifier):
#         if isinstance(node, IdentifiedNode):
#             return RDFProject(None, node)

#     def value_to_node(self, value: RDFProject) -> Identifier:
#         return value.uri


# class CollectionMembers(RDFField):
#     def get(self, g: Graph, instance):
#         for triple in g.triples((None, RDFS.member, instance.uri)):
#             print(triple)

#         return None

#         # query = f'''
#         # SELECT ?record
#         # WHERE {{
#         #     ?record     a edpoprec:Record ;
#         #                 rdfs:member {instance.uri} .
#         # }}
#         # '''
#         # namespaces = { 'edpoprec': EDPOPREC, 'edpopcol': EDPOPCOL, 'rdfs': RDFS }
#         # results = g.query(query, initNs=namespaces)
#         # return results

#     def _stored_triples(self, g: Graph, instance) -> Triples:
#         return g.triples((None, RDFS.member, instance.uri))

class EDPOPCollection(RDFModel):
    rdf_class = EDPOPCOL.Collection

    name = RDFUniquePropertyField(AS.name)
    summary = RDFUniquePropertyField(AS.summary)
    # projects = ProjectContextField()
