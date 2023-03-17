//import Backbone from 'backbone';
import { APIModel, APICollection } from '../utils/api.model'
import { Records } from '../record/record.model.js';

/**
 * Representation of a single VRE collection.
 */
export var VRECollection = APIModel.extend({
    getRecords: function() {
        if (!this.records) {
            var records = this.records = new Records();
            records.query({
                params: {collection__id: this.id},
            }).then(function() {
                records.trigger('complete');
            });
        }
        else {
            var records = this.records;
        }
        return this.records;
    },
});

export var VRECollections = APICollection.extend({
    url: '/vre/api/collections',
    model: VRECollection,
}, {
    /**
     * Class method for retrieving only the collections the user can manage.
     */
    mine: function() {
        var myCollections = new VRECollections();
        myCollections.fetch({url: myCollections.url + '/mine'});
        return myCollections;
    },
});