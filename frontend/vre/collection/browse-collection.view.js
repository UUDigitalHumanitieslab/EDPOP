import { CompositeView } from 'backbone-fractal';

import { SearchResults } from '../search/search.model.js';
import { SearchView } from '../search/search.view.js';
import collectionTemplate from './browse-collection.view.mustache';

export var BrowseCollectionView = CompositeView.extend({
    template: collectionTemplate,
    id: 'content',
    subviews: [
        {view: 'searchView', selector: '.page-header'},
    ],
    initialize: function() {
        this.results = new SearchResults;
        this.searchView = new SearchView({
            model: this.model,
            collection: this.results,
        }).render();
        this.render();
    },
    renderContainer: function() {
        this.$el.html(this.template(this.model.attributes));
        return this;
    },
});
