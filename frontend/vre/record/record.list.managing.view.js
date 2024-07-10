import { CompositeView } from 'backbone-fractal';
import { VRECollectionView } from '../collection/collection.view';
import { SelectAllView } from './select-all.view';
import { RecordListView } from './record.list.view';
import { GlobalVariables } from '../globals/variables';
import recordListManagingTemplate from './record.list.managing.view.mustache';

export var RecordListManagingView = CompositeView.extend({
    tagName: 'form',
    template: recordListManagingTemplate,

    subviews: [
        {view: 'vreCollectionsSelect', method: 'prepend'},
        'selectAllView',
        'recordListView',
    ],

    events: {
        'submit': function(event) {
            event.preventDefault();
            this.vreCollectionsSelect.submitForm(event);
        },
        'click .more-records': 'loadMore',
    },

    initialize: function(options) {
        this.vreCollectionsSelect = new VRECollectionView({
            collection: GlobalVariables.myCollections
        }).render();
        this.recordListView = new RecordListView({collection: this.collection});
        this.selectAllView = new SelectAllView();
        this.render().bindSelectAll();
    },

    renderContainer: function() {
        this.$el.html(this.template({}));
        return this;
    },

    loadMore: function(event) {
        this.collection.trigger('moreRequested', event);
    },

    bindSelectAll: function() {
        var selectAllView = this.selectAllView;
        var recordListView = this.recordListView;
        selectAllView.on({
            check: recordListView.checkAll,
            uncheck: recordListView.uncheckAll,
        }, recordListView);
        recordListView.on( {
            allChecked: selectAllView.check,
            notAllChecked: selectAllView.uncheck,
        }, selectAllView);
    },
});
