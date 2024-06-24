from triplestore.constants import AS, EDPOPCOL
from triplestore.rdf_model import RDFModel
from triplestore.rdf_field import RDFUniquePropertyField, RDFClassField

class RDFProject(RDFModel):
    project_class = RDFClassField(EDPOPCOL.Project)
    name = RDFUniquePropertyField(AS.name)
    summary = RDFUniquePropertyField(AS.summary)
