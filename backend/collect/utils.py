from django.conf import settings
from rdflib import RDF, URIRef
import re

from triplestore.constants import EDPOPCOL

def _name_to_slug(name: str) -> str:
    no_spaces = lambda s: re.sub(r'\s+', '_', s)
    clean = lambda s: re.sub(r'[^a-z0-9\-_]', '', s)
    strip_start = lambda s: re.sub(r'^\W+', '', s)
    strip_end = lambda s: re.sub(r'\W+$', '', s)

    return strip_end(strip_start(clean(no_spaces(str.lower(name)))))


def collection_uri(name: str):
    id = _name_to_slug(name)
    return URIRef(settings.RDF_NAMESPACE_ROOT + 'collections/' + id)


def collection_exists(uri):
    store = settings.RDFLIB_STORE
    triples = store.triples((uri, RDF.type, EDPOPCOL.Collection))
    return any(triples)

