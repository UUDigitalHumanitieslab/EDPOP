import {Record, Records} from '../record/record.model';
import {JsonLdWithOCCollection} from "../utils/jsonld.model";

export var SearchResults = JsonLdWithOCCollection.extend({
    url: '/api/catalogs/search/',
    model: Record,
});