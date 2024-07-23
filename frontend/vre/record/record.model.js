import { APIModel } from '../utils/api.model';
import { Annotations } from '../annotation/annotation.model';
import {JsonLdModel, JsonLdWithOCCollection} from "../utils/jsonld.model";

export var Record = JsonLdModel.extend({
    urlRoot: '/api/records',
    /**
     * Get the contents of the main display field, usually title or name
     * @return {string}
     */
    getMainDisplay: function() {
        /* For now, just support edpoprec:BibliographicalRecord and
           edpoprec:BiographicalRecord with hardcoded solutions */
        let field;
        if (this.get("@type") === "edpoprec:BibliographicalRecord") {
            field = this.get("edpoprec:title");
        } else if (this.get("@type") === "edpoprec:BiographicalRecord") {
            field = this.get("edpoprec:name");
        }
        if (typeof field !== "undefined") {
            return field["edpoprec:originalText"];
        } else {
            // Cannot determine which field has the main text; return subject URI instead
            return `<${this.id}>`;
        }
    },
    getAnnotations: function() {
        if (!this.annotations) {
            this.annotations = new Annotations();
            if (!this.isNew()) this.annotations.query({
                params: {record__id: this.id}
            });
        }
        return this.annotations;
    },
});

export var Records = JsonLdWithOCCollection.extend({
    model: Record,
});