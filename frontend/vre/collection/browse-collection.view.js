import { View } from 'backbone';
import collectionTemplate from './browse-collection.view.mustache';

export var BrowseCollectionView = View.extend({
    template: collectionTemplate,
    id: 'content',
    initialize: function() {
        this.render();
    },
    render: function() {
        this.$el.html(this.template(this.model.attributes));
        return this;
    },
});
