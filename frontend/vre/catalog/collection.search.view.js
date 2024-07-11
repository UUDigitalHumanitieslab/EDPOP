import { CompositeView } from 'backbone-fractal';

import { SearchResults } from '../search/search.model.js';
import { SearchView } from '../search/search.view.js';
import { RecordListManagingView } from '../record/record.list.managing.view.js';
import collectionSearchTemplate from './collection.search.view.mustache';

export var CollectionSearchView = CompositeView.extend({
    template: collectionSearchTemplate,
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
            collection: this.collection,
        });
        this.render();
    },
    renderContainer: function() {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    },
});
