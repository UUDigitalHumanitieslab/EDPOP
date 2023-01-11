import { View } from 'backbone';
import fieldTemplate from './field.view.mustache';

/**
 * Displays a single model from a FlatFields or FlatAnnotations collection.
 */
export var FieldView = View.extend({
    tagName: 'tr',
    template: fieldTemplate,
    events: {
        'click': 'edit',
    },
    initialize: function(options) {
        this.listenTo(this.model, 'change:value', this.render);
    },
    render: function() {
        this.$el.html(this.template(this.model.attributes));
        return this;
    },
    edit: function(event) {
        this.trigger('edit', this.model);
    },
});