import Backbone from 'backbone';
import selectDBTemplate from './select-catalog.view.mustache';

export var SelectCatalogView = Backbone.View.extend({
    template: selectDBTemplate,
    tagName: 'li',
    className: 'dropdown',
    events: {
        'click li': 'select',
    },
    initialize: function() {
        this.render();
    },
    getCatalogs: function() {
        return _.sortBy(this.collection.toJSON(), 'name');
    },
    render: function() {
        var context = {
            'catalogs': this.getCatalogs(),
        };
        this.$el.html(this.template(context));
    },
});