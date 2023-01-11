import { View } from 'backbone';
import collectionTemplate from './collection.view.mustache';

export var CollectionView = View.extend({
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
