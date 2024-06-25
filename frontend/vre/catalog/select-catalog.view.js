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
    render: function() {
        var catalogs = _.sortBy(this.collection.toJSON(), (x) => (x.name));
        var context = {
            'catalogs': catalogs,
        };
        this.$el.html(this.template(context));
    },
    select: function(event) {
        event.preventDefault();
        var href = $(event.target).attr('href');
        Backbone.history.navigate(href, true);
        var selectedDB = event.target.innerText;
        this.$el.html(this.template({'selected-db': selectedDB, 'collections': this.collection.toJSON()}));
    },
});