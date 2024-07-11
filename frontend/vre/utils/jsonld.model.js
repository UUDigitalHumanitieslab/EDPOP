import {APICollection} from "./api.model";

/**
 * The @graph property inside JSON-LD
 * @typedef {Object} JSONLDGraph
 */

/**
 * An individual subject definition inside JSON-LD
 * @typedef {Object} JSONLDSubject
 */

/**
 * Generic subclass of APICollection that parses incoming JSON-LD to an
 * array of all subjects. The contents of subjects are left unchanged.
 */
export var JsonLdCollection = APICollection.extend({
    parse: function(response) {
        return response["@graph"];
    }
});

/**
 * Return a nested version of a given subject by adding to it the objects
 * it refers to if they are found in the graph.
 * The subject passed to this function as an argument is not changed.
 * @param graph{JSONLDGraph} - The full contents of the graph in JSON-LD
 * @param subject{JSONLDSubject} - The subject including its predicates and objects to create a nested version of
 * @returns {Object}
 */
export function nestSubject(graph, subject) {
    const recursiveFunction = function(graph, subject, baseSubject) {
        const transformedSubject = _.clone(subject);
        for (let property of Object.keys(subject)) {
            if (subject[property].hasOwnProperty("@id")) {
                // This is a reference to another subject
                const refereedSubject = graph.find((thisSubject) => thisSubject["@id"] === subject[property]["@id"]);
                if (refereedSubject && refereedSubject["@id"] !== baseSubject["@id"]) {
                    /* If the refereed subject was found in the graph, use it as replacement.
                       Only do this if the subject is not the same as the one we started with,
                       to avoid an endless loop. (Alternative would be to create a circular reference) */
                    transformedSubject[property] = recursiveFunction(graph, refereedSubject, baseSubject);
                }
            }
        }
        return transformedSubject;
    }
    return recursiveFunction(graph, subject, subject);
}

/**
 * Generic subclass of APICollection that parses incoming JSON-LD to an
 * ordered array of subjects according to the information of the
 * `OrderedCollection` entity (ActivityStreams ontology) from the same graph.
 * Sets the `totalResults` attribute if available.
 * The graph should contain exactly one `OrderedCollection`.
 * @class
 */
export var JsonLdWithOCCollection = APICollection.extend({
    /**
     * The total number of results. This is filled by `parse` if the
     * `OrderedCollection` subject comes with `totalItems`.
     * @type {?number}
     */
    totalResults: null,
    /**
     * The prefix, used in JSON-LD, for the ActivityStreams namespace.
     * Defaults to `as:` but can be overridden.
     * @type {string}
     */
    activityStreamsPrefix: "as:",
    parse: function(response) {
        // Get all subjects of the graph with their predicates and objects as an array
        const allSubjects = response["@graph"];
        const orderedCollection = allSubjects.find((subject) => {return subject["@type"] === `${this.activityStreamsPrefix}OrderedCollection`}, this);
        this.totalResults = orderedCollection[`${this.activityStreamsPrefix}totalItems`] ?? null;
        const orderedItems = orderedCollection[`${this.activityStreamsPrefix}orderedItems`]["@list"]
        const result = orderedItems.map((subject) => {
            const id = subject["@id"];
            const orderedSubject = allSubjects.find((subject) => subject["@id"] === id);
            return nestSubject(allSubjects, orderedSubject);
        }, this);
        return result;
    }
});
