from rdflib import Literal

from triplestore.constants import AS, EDPOPCOL
from triplestore.rdf_model import (
    RDFModel, RDFClassField, RDFUniquePropertyField
)

class ASNameField(RDFUniquePropertyField):
    def __init__(self):
        super().__init__(AS.name)()

    def value_to_node(self, value: str) -> Literal:
        return Literal(value)

    def node_to_value(self, node: Literal):
        return node.value


class ASSummaryField(RDFUniquePropertyField):
    def __init__(self, ):
        super().__init__(AS.summary)()

    def value_to_node(self, value: str) -> Literal:
        return Literal(value)

    def node_to_value(self, node: Literal):
        return node.value


class RDFProject(RDFModel):
    project_class = RDFClassField(EDPOPCOL.Project)
    name = ASNameField()
    summary = ASSummaryField()
