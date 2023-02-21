import { View } from 'backbone';
import groupMenuItemTemplate from './group.menu.item.view.mustache';

export var GroupMenuItemView = View.extend({
    tagName: 'li',
    template: groupMenuItemTemplate,
    events: {
        'click': 'select',
    },
    render: function() {
        this.$el.html(this.template(this.model.attributes));
        return this;
    },
    select: function(event) {
        event.preventDefault();
        this.trigger('select', this.model);
    },
    activate: function(model) {
        if (model === this.model) {
            this.$el.addClass('active');
        } else {
            this.$el.removeClass('active');
        }
    },
});
