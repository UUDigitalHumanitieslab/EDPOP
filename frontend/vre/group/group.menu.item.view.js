import { View } from 'backbone';
import groupMenuItemTemplate from './group.menu.item.view.mustache';

export var GroupMenuItemView = View.extend({
    tagName: 'li',
    template: groupMenuItemTemplate,

    events: {
        'click': 'select',
    },

    initialize: function() {
        this.render().listenTo(this.model, {
            select: this.activate,
            deselect: this.deactivate,
        });
    },

    render: function() {
        this.$el.html(this.template(this.model.attributes));
        return this;
    },

    select: function(event) {
        event.preventDefault();
        this.model.trigger('select', this.model);
    },

    activate: function(model) {
        this.$el.addClass('active');
    },

    deactivate: function(model) {
        this.$el.removeClass('active');
    },
});
