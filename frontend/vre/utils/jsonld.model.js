import {APICollection} from "./api.model";

/**
 * The @graph property inside JSON-LD
 * @typedef {Object} JSONLDGraph
 */

/**
 * An individual subject definition inside JSON-LD
 * @typedef {Object} JSONLDSubject
 */

export var JsonLdModel = Backbone.Model.extend({
    idAttribute: '@id',
});

/**
 * Generic subclass of APICollection that parses incoming compacted JSON-LD to an
 * array of all subjects. The contents of subjects are left unchanged.
 */
export var JsonLdCollection = APICollection.extend({
    model: JsonLdModel,
    parse: function(response) {
        if (!response.hasOwnProperty("@graph")) {
            throw "Response has no @graph key, is this JSON-LD in compacted form?";
        }
        return response["@graph"];
    }
});

/**
 * Return a nested version of a given subject by adding to it the objects
 * it refers to if they are found in the graph.
 * The subject passed to this function as an argument is not changed.
 * @param subjectsByID{Dictionary<JSONLDSubject>} - The full contents of the graph in JSON-LD
 * @param subject{JSONLDSubject} - The subject including its predicates and objects to create a nested version of
 * @param parentSubjectIDs{Array<String>} - For internal use of recursive function; leave undefined
 * @returns {Object}
 */
export function nestSubject(subjectsByID, subject, parentSubjectIDs=undefined) {
    if (typeof parentSubjectIDs === "undefined") {
        parentSubjectIDs = [subject["@id"]];
    } else {
        parentSubjectIDs = Array.from(parentSubjectIDs);
        parentSubjectIDs.push(subject["@id"]);
    }
    const transformedSubject = _.clone(subject);
    for (let property of Object.keys(subject)) {
        if (subject[property].hasOwnProperty("@id")) {
            // This is a reference to another subject
            const refereedSubject = subjectsByID[subject[property]["@id"]];
            if (refereedSubject && !(parentSubjectIDs.includes(refereedSubject["@id"]))) {
                /* If the refereed subject was found in the graph, use it as replacement.
                   Only do this if the subject is not the same as the one we started with,
                   to avoid an endless loop. (Alternative would be to create a circular reference) */
                transformedSubject[property] = nestSubject(subjectsByID, refereedSubject, parentSubjectIDs);
            }
        }
    }
    return transformedSubject;
}

/**
 * Generic subclass of APICollection that parses incoming compacted JSON-LD to an
 * ordered array of subjects according to the information of the
 * `OrderedCollection` entity (ActivityStreams ontology) from the same graph.
 * Sets the `totalResults` attribute if available.
 * The graph should contain exactly one `OrderedCollection`.
 * @class
 */
export var JsonLdWithOCCollection = APICollection.extend({
    model: JsonLdModel,
    /**
     * The total number of results. This is filled by `parse` if the
     * `OrderedCollection` subject comes with `totalItems`.
     * @type {?number}
     */
    totalResults: undefined,
    /**
     * The prefix, used in JSON-LD, for the ActivityStreams namespace.
     * Defaults to `as:` but can be overridden.
     * @type {string}
     */
    activityStreamsPrefix: "as:",
    parse: function(response) {
        // Get all subjects of the graph with their predicates and objects as an array
        if (!response.hasOwnProperty("@graph")) {
            throw "Response has no @graph key, is this JSON-LD in compacted form?";
        }
        const allSubjects = response["@graph"];
        const orderedCollection = allSubjects.find((subject) => {return subject["@type"] === `${this.activityStreamsPrefix}OrderedCollection`}, this);
        this.totalResults = orderedCollection[`${this.activityStreamsPrefix}totalItems`];
        const orderedItems = orderedCollection[`${this.activityStreamsPrefix}orderedItems`]["@list"]
        const subjectsByID = _.keyBy(allSubjects, '@id'); // NOTE: change to indexBy when migrating to underscore
        const result = orderedItems.map((subject) => {
            const orderedSubject = subjectsByID[subject["@id"]];
            return nestSubject(subjectsByID, orderedSubject);
        });
        return result;
    }
});
