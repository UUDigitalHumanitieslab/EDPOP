from typing import Tuple, List, Union, Iterator
from rdflib import Graph, URIRef, BNode, RDF, Literal, RDFS
from edpop_explorer.readers import HPBReader
from .constants import SKOS
from .utils import ObjectURIs, objects_to_graph

from vre.models import Record
from .constants import EDPOPREC
from .record_ontology import import_ontology

def import_records(records: Iterator[Record]) -> Tuple[ObjectURIs, Graph]:
    catalog_uri, catalog_graph = legacy_catalog_to_graph()
    property_uris, property_graph = import_record_properties(records)
    
    convert = lambda record: import_record(record, catalog_uri, property_uris)
    to_id = lambda record: record.id
    record_uris, records_graph =  objects_to_graph(convert, to_id, records)
    g = catalog_graph + property_graph + records_graph
    return record_uris, g

def legacy_catalog_to_graph() -> Tuple[URIRef, Graph]:
    reader = HPBReader()
    graph = reader.catalog_to_graph()
    subject, _, _ = next(graph.triples((None, RDF.type, None)))
    return subject, graph

def import_record_properties(records: Iterator[Record]):
    property_keys = [
        key
        for record in records
        for key in record.content
    ]
    return import_properties(property_keys)

def import_properties(keys: List[str]) -> Tuple[ObjectURIs, Graph]:
    identity = lambda key: key
    ontology = import_ontology()
    convert = lambda label: import_property(label, ontology)
    return objects_to_graph(convert, identity, set(keys))

def import_property(label: str, ontology: Graph) -> Tuple[URIRef, Graph]:
    return existing_property(label, ontology) or new_property(label)

def existing_property(label: str, ontology: Graph) -> Union[Tuple[URIRef, Graph], None]:
    '''
    Match a string label to an existing property in the ontology.

    Looks for a resource with `edpoprec:BibligraphicalRecord` or `edpoprec:Record`
    as its domain, and a `skos:prefLabel` that matches the label.

    If this resource exists, returns its URI and an empty graph. If not, returns `None`.
    '''
    
    query = '''
    SELECT ?property ?label
    WHERE {
        { ?property   rdfs:domain edpoprec:BibliographicalRecord }
            UNION { ?property   rdfs:domain edpoprec:Record }
        ?property   skos:prefLabel ?label .
    }
    '''

    result = ontology.query(query, initNs={'rdfs': RDFS, 'edpoprec': EDPOPREC, 'skos': SKOS})

    matches = lambda pref_label: str(pref_label) == label
    match = next(
        (property for property, pref_label in result if matches(pref_label)),
        None
    )
    
    if match:
        # also return a graph to match the return type of similar functions.
        # the property is already in the ontology; we don't need to
        # add new triples to describe it.
        return match, Graph()


def new_property(key: str) -> Tuple[URIRef, Graph]:
    g = Graph()
    property = BNode()
    g.add((property, RDF.type, RDF.Property))
    g.add((property, RDFS.domain, EDPOPREC.Record))
    g.add((property, RDFS.range, EDPOPREC.Field))
    g.add((property, SKOS.prefLabel, Literal(key)))

    return property, g

def import_record(record: Record, catalog: URIRef, record_properties: ObjectURIs) -> Tuple[URIRef, Graph]:
    g = Graph()
    subject = BNode()
    g.add((subject, RDF.type, EDPOPREC.Record))
    g.add((subject, EDPOPREC.fromCatalog, catalog))
    g.add((subject, EDPOPREC.identifier, Literal(record.uri)))
    g.add((subject, EDPOPREC.originalData, Literal(record.content)))

    for (key, value) in record.content.items():
        property = record_properties[key]
        g += import_field(subject, property, value)

    return subject, g


def import_field(subject: URIRef, property: URIRef, value: str) -> Graph:
    g = Graph()

    field = BNode()
    g.add((field, RDF.type, EDPOPREC.Field))
    g.add((field, EDPOPREC.originalText, Literal(value)))    

    g.add((subject, property, field))

    return g
