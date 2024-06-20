//import Backbone from 'backbone';
import { APIModel, APICollection } from '../utils/api.model'
import { Records } from '../record/record.model.js';
import {JsonLdCollection} from "../utils/jsonld.model";

/**
 * Representation of a single catalogue.
 */
export var Catalog = APIModel.extend({
});

export var Catalogs = JsonLdCollection.extend({
    url: '/api/catalogs/catalogs/',
    model: Catalog,
});