import { LazyTemplateView } from '../utils/lazy.template.view';
import { AlertView } from '../alert/alert.view';
import { AdditionsToCollections } from '../additions/additions-to-collections'


export var VRECollectionView = LazyTemplateView.extend({
    templateName: 'collection-selector',
    events: {
        'click button': 'submitForm',
        'change select': 'activateButton',
    },
    render: function() {
        var shownCollections = this.collection.clone();
        shownCollections.remove(currentVRECollection);
        this.$el.html(this.template({models: shownCollections.toJSON()}));
        this.$('select').select2();
        return this;
    },
    setRecord: function(model) {
        this.model = model;
        return this;
    },
    clear: function() {
        this.$el.val(null).trigger('change');
        return this;
    },
    activateButton: function(event) {
        event.preventDefault();
        if (this.$('select').val().length) {
            this.$('button').removeClass("disabled");
        }
        else {
            this.$('button').addClass("disabled");
        }
    },
    submitForm: function(event) {
        event.preventDefault();
        var selected_records = [];
        if (this.model) {
            // adding to array as the api expects an array.
            selected_records.push(this.model.toJSON());
        }
        else {
            selected_records = _(recordsList.items).filter({selected: true}).invokeMap('model.toJSON').value();
        }
        var selected_collections = this.$('select').val();
        var records_and_collections = new AdditionsToCollections({
            'records': selected_records,
            'collections': selected_collections,
        });
        records_and_collections.save().then(
            this.showSuccess.bind(this),
            this.showError.bind(this),
        );
    },
    showSuccess: function(response) {
        var feedbackString = '';
        $.each(response, function(key, value) {
            feedbackString = feedbackString.concat('Added ', value, ' record(s) to ', key, ". ");
        });
        this.showAlert('success', feedbackString);
    },
    showError: function(response) {
        this.showAlert('warning', response.responseJSON.error);
    },
    showAlert: function(level, message) {
        var alert = new AlertView({level: level, message: message});
        alert.render().$el.prependTo(this.el);
        alert.animate('remove');
    },
});