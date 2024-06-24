from triplestore.constants import AS, EDPOPCOL
from triplestore.rdf_model import RDFModel
from triplestore.rdf_field import RDFUniquePropertyField

class RDFProject(RDFModel):
    rdf_class = EDPOPCOL.Project

    name = RDFUniquePropertyField(AS.name)
    summary = RDFUniquePropertyField(AS.summary)
