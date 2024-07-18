import { APIModel } from '../utils/api.model'
import {JsonLdCollection} from "../utils/jsonld.model";

/**
 * Representation of a single catalogue.
 */
export var Catalog = APIModel.extend({
});

/**
 * Representation of all available catalogs
 */
export var Catalogs = JsonLdCollection.extend({
    url: '/api/catalogs/catalogs/',
    model: Catalog,
});