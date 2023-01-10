import { LazyTemplateView } from '../utils/lazy.template.view'

export var GroupMenuItemView = LazyTemplateView.extend({
    tagName: 'li',
    templateName: 'group-menu-item',
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
