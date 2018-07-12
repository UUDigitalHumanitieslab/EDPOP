import { LazyTemplateView } from '../utils/lazy.template.view';
import { FlatAnnotations } from '../annotation/annotation.model';
import { RecordFieldsView, RecordAnnotationsView } from '../field/record.field.view';
import { FlatFields } from '../field/field.model';
import { VRECollectionView } from '../collection/collection.view';
import { GlobalVariables } from '../globals/variables';

export var RecordDetailView = LazyTemplateView.extend({
    templateName: 'record-detail',
    className: 'modal',
    attributes: {
        'role': 'dialog',
    },
    events: {
        'click #load_next': 'load',
        'click #load_previous': 'load',
    },
    initialize: function(options) {
        this.$el.html(this.template(this.model));
        this.$title = this.$('.modal-title');
        this.$body = this.$('.modal-body');
        this.$footer = this.$('.modal-footer');
        this.vreCollectionsSelect = new VRECollectionView({collection: GlobalVariables.myCollections});
    },
    setModel: function(model) {
        if (this.model) {
            if (this.model === model) return this;
            this.annotationsView.remove().off();
            this.fieldsView.remove().off();
        }
        this.model = model;
        this.fieldsView = new RecordFieldsView({
            collection: new FlatFields(null, {record: model}),
        });
        this.annotationsView = new RecordAnnotationsView({
            collection: new FlatAnnotations(null, {record: model}),
        });
        this.vreCollectionsSelect.clear().setRecord(model);
        this.annotationsView.listenTo(this.fieldsView, 'edit', this.annotationsView.edit);
        var uriText = this.model.get('uri');
        this.$title.text(uriText);
        this.$("#uri-link").attr("href", uriText);
        this.fieldsView.render().$el.appendTo(this.$body);
        this.annotationsView.render().$el.appendTo(this.$body);
        return this;
    },
    render: function() {
        this.$footer.prepend(this.vreCollectionsSelect.render().$el);
        this.$el.modal('show');
        return this;
    },
    load: function(event) {
        event.preventDefault();
        var currentIndex = GlobalVariables.recordsList.collection.findIndex(this.model);
        var nextIndex = event.target.id==='load_next'? currentIndex+1 : currentIndex-1;
        var nextModel = GlobalVariables.recordsList.collection.at(nextIndex);
        this.setModel(nextModel).render();
    },
});