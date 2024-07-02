import Backbone from 'backbone';
import selectDBTemplate from './select-collection.view.mustache';
import {GlobalVariables} from "../globals/variables";

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
        this.$el.html(this.template({'collections': this.collection.toJSON()}));
    },
});