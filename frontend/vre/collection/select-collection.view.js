import Backbone from 'backbone';
import selectDBTemplate from './select-collection.view.mustache';

export var SelectCollectionView = Backbone.View.extend({
    template: selectDBTemplate,
    tagName: 'li',
    className: 'dropdown',
    events: {
        'click li': 'select',
    },
    initialize: function() {
        this.render();
    },
    render: function() {
        var collections = {
            'collections': this.collection.toJSON(),
        };
        this.$el.html(this.template(collections));
    },
    select: function(event) {
        event.preventDefault();
        var href = $(event.target).attr('href');
        Backbone.history.navigate(href, true);
        var selectedCollection = event.target.innerText;
        this.$el.html(this.template({'selected_collection': selectedCollection, 'collections': this.collection.toJSON()}));
    },
});