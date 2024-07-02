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
        const collections = this.collection.toJSON();
        const currentCollection = GlobalVariables.currentVRECollection;
        if (currentCollection) {
            collections.find((el) => el["id"] === currentCollection.get("id")).selected = true;
        }
        const context = {
            'collections': collections,
        }
        this.$el.html(this.template(context));
    },
    select: function(event) {
        event.preventDefault();
        var href = $(event.target).attr('href');
        Backbone.history.navigate(href, true);
        this.render();
    },
});