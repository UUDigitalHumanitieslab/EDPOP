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
