import { CollectionView } from 'backbone-fractal';
import { FieldView } from './field.view';
import fieldListTemplate from './record.base.view.mustache';

export var RecordFieldsBaseView = CollectionView.extend({
    template: fieldListTemplate,
    container: 'tbody',

    initialize: function(options) {
        this.initItems().render().initCollectionEvents();
    },

    makeItem: function(model) {
        var row = new FieldView({model: model});
        row.on('edit', this.edit, this);
        return row;
    },

    renderContainer: function() {
        this.$el.html(this.template(this));
        return this;
    },
});
