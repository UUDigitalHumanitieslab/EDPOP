import { View } from 'backbone';
import { AlertView } from '../alert/alert.view';
import { AdditionsToCollections } from '../additions/additions-to-collections';
import { GlobalVariables } from '../globals/variables';
import collectionTemplate from './collection.view.mustache';

/**
 * View to add a record to a specific collection.
 */
export var VRECollectionView = View.extend({
    template: collectionTemplate,
    events: {
        'click button': 'submitForm',
        'change select': 'activateButton',
    },
    initialize: function() {
        this.render();
    },
    render: function() {
        var shownCollections = this.collection.clone();
        shownCollections.remove(GlobalVariables.currentVRECollection);
        this.$('select').select2('destroy');
        this.$el.html(this.template({
            models: shownCollections.toJSON(),
            cid: this.cid,
        }));
        this.$('select').select2();
        return this;
    },
    remove: function() {
        this.$('select').select2('destroy');
        return VRECollectionView.__super__.remove.call(this);
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
        var selected_records = _(GlobalVariables.recordsList.items)
            .filter({selected: true})
            .invokeMap('model.toJSON')
            .value();
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
