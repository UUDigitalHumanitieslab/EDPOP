import {APICollection} from "./api.model";

/**
 * Generic subclass of APICollection that parses incoming JSON-LD to a
 * list of subjects.
 */
export var JsonLdCollection = APICollection.extend({
    parse: function(response) {
        const graph = response["@graph"];
        return response["@graph"];
    }
});
