import Backbone from 'backbone';
import selectDBTemplate from './select-db.view.mustache';

export var SelectDatabaseView = Backbone.View.extend({
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
        var collections = {'collections': this.collection.toJSON()};
        this.$el.html(this.template(collections));
    },
    select: function(event) {
        event.preventDefault();
        var href = $(event.target).attr('href');
        Backbone.history.navigate(href, true);
        var selectedDB = event.target.innerText;
        this.$el.html(this.template({'selected-db': selectedDB, 'collections': this.collection.toJSON()}));
    },
});