import { CompositeView } from '../core/view.js';

import { SearchResults } from '../search/search.model.js';
import { SearchView } from '../search/search.view.js';
import { RecordListManagingView } from '../record/record.list.managing.view.js';
import collectionTemplate from './browse-collection.view.mustache';

export var BrowseCollectionView = CompositeView.extend({
    template: collectionTemplate,
    subviews: [
        {view: 'searchView', selector: '.page-header'},
        'recordsManager',
    ],
    initialize: function() {
        this.collection = this.collection || new SearchResults;
        this.searchView = new SearchView({
            model: this.model,
            collection: this.collection,
        });
        this.recordsManager = new RecordListManagingView({
            collection: this.collection
        });
        this.model.getRecords(this.collection);
        this.render();
    },
    renderContainer: function() {
        this.$el.html(this.template(this.model.attributes));
        return this;
    },
});
