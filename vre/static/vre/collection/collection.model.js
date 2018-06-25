//import { Backbone } from 'backbone';
import { APICollection } from '../utils/api.model'

/**
 * Representation of a single VRE collection.
 */
export var VRECollection = Backbone.Model.extend({
    getRecords: function() {
        if (!this.records) {
            var records = this.records = new Records();
            records.query({
                params: {collection__id: this.id},
            }).then(function() {
                records.trigger('complete');
            });
        }
        return records;
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