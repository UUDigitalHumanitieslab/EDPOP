//import Backbone from 'backbone';
import { APIModel, APICollection } from '../utils/api.model'
import { Records } from '../record/record.model.js';

/**
 * Representation of a single VRE collection.
 */
export var VRECollection = APIModel.extend({
    getRecords: function(records) {
        if (!records) {
            if (this.records) return this.records;
            records = this.records = new Records();
        }
        records.query({
            params: {collection__id: this.id},
            // records could be either a Results or a Records. The next two
            // options ensure behavior consistent with a Records.
            url: Records.prototype.url,
            parse: false,
        }).then(function() {
            records.trigger('complete');
        });
        return records;
    },
});

export var VRECollections = APICollection.extend({
    url: '/api/collections/',
    model: VRECollection,
}, {
    /**
     * Class method for retrieving only the collections the user can manage.
     */
    mine: function(myCollections) {
        myCollections = myCollections || new VRECollections();
        myCollections.fetch();
        return myCollections;
    },
});
