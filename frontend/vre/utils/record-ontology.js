/**
 * Models, collections and utilities related to the record ontology.
 */

import {JsonLdNestedCollection} from "./jsonld.model";

/**
 * A Backbone collection to access the properties defined by the ontology.
 */
export var PropertyList = JsonLdNestedCollection.extend({
    url: "/static/edpop-record-ontology.json",
    targetClass: "rdf:property",
});

export var properties = new PropertyList();
properties.fetch();

/**
 * A list of all field types according to the record ontology.
 * This is hardcoded for now because there is no trivial way to infer this
 * by reasoning from the ontology JSON-LD file.
 * @type {string[]}
 */
export const fieldList = [
    'edpoprec:Field',
    'edpoprec:DatingField',
    'edpoprec:LanguageField',
    'edpoprec:LocationField',
];
