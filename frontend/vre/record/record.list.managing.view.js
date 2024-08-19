import { CompositeView } from 'backbone-fractal';
import { VRECollectionView } from '../collection/collection.view';
import { RecordListView } from './record.list.view';
import { GlobalVariables } from '../globals/variables';
import recordListManagingTemplate from './record.list.managing.view.mustache';
import {NewRecordListView} from "./new.record.list.view";

export var RecordListManagingView = CompositeView.extend({
    tagName: 'form',
    template: recordListManagingTemplate,

    subviews: [
        {view: 'vreCollectionsSelect', method: 'prepend'},
        'recordListView',
    ],

    events: {
        'submit': function(event) {
            event.preventDefault();
            var selection = this.recordListView.currentSelection();
            this.vreCollectionsSelect.submitForm(event, selection);
        },
        'click .more-records': 'loadMore',
    },

    initialize: function(options) {
        this.vreCollectionsSelect = new VRECollectionView({
            collection: GlobalVariables.myCollections
        }).render();
        this.recordListView = new NewRecordListView({collection: this.collection});
        this.render();
        this.recordListView.render();
    },

    renderContainer: function() {
        this.$el.html(this.template({}));
        return this;
    },

    loadMore: function(event) {
        this.collection.trigger('moreRequested', event);
    },
});
