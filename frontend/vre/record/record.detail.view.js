import { View } from 'backbone';
import { vreChannel } from '../radio';
import { FlatAnnotations } from '../annotation/annotation.model';
import { RecordFieldsView } from '../field/record.fields.view';
import { RecordAnnotationsView } from '../field/record.annotations.view';
import { FlatFields } from '../field/field.model';
import { VRECollectionView } from '../collection/collection.view';
import { GlobalVariables } from '../globals/variables';
import recordDetailTemplate from './record.detail.view.mustache';

export var RecordDetailView = View.extend({
    template: recordDetailTemplate,
    className: 'modal',
    attributes: {
        'role': 'dialog',
    },
    events: {
        'click #load_next': 'next',
        'click #load_previous': 'previous',
    },
    initialize: function(options) {
        var model = this.model;
        this.fieldsView = new RecordFieldsView({
            collection: new FlatFields(null, {record: model}),
        }).render();
        this.annotationsView = new RecordAnnotationsView({
            collection: new FlatAnnotations(null, {record: model}),
        }).render();
        this.annotationsView.listenTo(this.fieldsView, 'edit', this.annotationsView.edit);
        this.vreCollectionsSelect = new VRECollectionView({
            collection: GlobalVariables.myCollections,
            model: model,
        });
        this.render();
    },
    render: function() {
        this.fieldsView.$el.detach();
        this.annotationsView.$el.detach();
        this.vreCollectionsSelect.$el.detach();
        this.$el.html(this.template(this.model));
        this.$title = this.$('.modal-title');
        this.$body = this.$('.modal-body');
        this.$footer = this.$('.modal-footer');
        var uriText = this.model.get('uri') || '';
        this.$title.text(uriText);
        this.$("#uri-link").attr("href", uriText);
        this.fieldsView.$el.appendTo(this.$body);
        this.annotationsView.$el.appendTo(this.$body);
        this.vreCollectionsSelect.$el.prependTo(this.$footer);
        return this;
    },
    remove: function() {
        this.$el.modal('hide');
        this.fieldsView.remove();
        this.annotationsView.remove();
        this.vreCollectionsSelect.remove();
        RecordDetailView.__super__.remove.call(this);
        return this.trigger('remove');
    },
    display: function() {
        this.$el.modal('show');
        return this;
    },
    next: function(event) {
        event.preventDefault();
        vreChannel.trigger('displayNextRecord');
    },
    previous: function(event) {
        event.preventDefault();
        vreChannel.trigger('displayPreviousRecord');
    },
});