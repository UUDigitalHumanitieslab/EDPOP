import { View } from 'backbone';
import collectionSearchTemplate from './collection.search.view.mustache';

export var CollectionSearchView = View.extend({
    template: collectionSearchTemplate,
    id: "content",
    initialize: function() {
        this.render();
    },
    render: function() {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    },
});
