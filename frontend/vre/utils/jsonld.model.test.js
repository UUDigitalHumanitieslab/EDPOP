import assert from 'assert';
import sinon from 'sinon';
import {nestSubject} from "./jsonld.model";

function findById(graph, id) {
    return graph.find((subject) => subject["@id"] === id);
}

const exampleJsonLDGraph = [{
    "@id": "http://example.com/s1",
    "dc:title": "Title without references",
}, {
    "@id": "http://example.com/s2",
    "dc:title": "Title with one internal reference",
    "dc:description": {
        "@id": "http://example.com/descForS2",
    },
}, {
    "@id": "http://example.com/s3",
    "dc:title": "Title with one external (or missing) reference",
    "dc:description": {
        "@id": "http://example.com/somethingExternal",
    },
}, {
    "@id": "http://example.com/s4",
    "dc:title": "Title with one nested internal reference",
    "dc:description": {
        "@id": "http://example.com/descForS4",
    },
}, {
    "@id": "http://example.com/s5",
    "dc:title": "Title with sameAs s6",
    "owl:sameAs": {
        "@id": "http://example.com/s6",
    },
}, {
    "@id": "http://example.com/s6",
    "dc:title": "Title with sameAs s5",
    "owl:sameAs": {
        "@id": "http://example.com/s5",
    },
}, {
    "@id": "http://example.com/descForS4",
    "example:value": {
        "@id": "http://example.com/descForDescForS4"
    }
}, {
    "@id": "http://example.com/descForDescForS4",
    "example:value": "Random description",
}, {
    "@id": "http://example.com/descForS2",
    "example:value": "Random description",
}];

describe('nestSubject', () => {
    it('does not change anything if there are no references', () => {
        const subject = findById(exampleJsonLDGraph, "http://example.com/s1");
        const ns = nestSubject(exampleJsonLDGraph, subject);
        assert.equal(ns["dc:title"], "Title without references");
    });
    it('correctly handles internal references', () => {
        const subject = findById(exampleJsonLDGraph, "http://example.com/s2");
        const ns = nestSubject(exampleJsonLDGraph, subject);
        assert.equal("Random description", ns["dc:description"]["example:value"]);
    });
    it('does not alter external references', () => {
        const subject = findById(exampleJsonLDGraph, "http://example.com/s3");
        const ns = nestSubject(exampleJsonLDGraph, subject);
        assert.equal(subject["dc:description"], ns["dc:description"]);
    });
    it('correctly handles a nested internal reference', () => {
        const subject = findById(exampleJsonLDGraph, "http://example.com/s4");
        const ns = nestSubject(exampleJsonLDGraph, subject);
        assert.equal("Random description", ns["dc:description"]["example:value"]["example:value"]);
    });
    it('does not resolve a recursive reference', () => {
        const subject = findById(exampleJsonLDGraph, "http://example.com/s5");
        const ns = nestSubject(exampleJsonLDGraph, subject);
        assert.equal("http://example.com/s5", ns["owl:sameAs"]["owl:sameAs"]["@id"]);
    });
});