import { LazyTemplateView } from '../utils/lazy.template.view';

/**
 * Displays a single model from a FlatFields or FlatAnnotations collection.
 */
var FieldView = LazyTemplateView.extend({
    tagName: 'tr',
    templateName: 'field-list-item',
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