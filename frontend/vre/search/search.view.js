import { CompositeView } from 'backbone-fractal';
import { AlertView } from '../alert/alert.view';
import { GlobalVariables } from '../globals/variables';
import searchViewTemplate from './search.view.mustache';
import failedSearchTemplate from './failed.search.message.mustache';

export var SearchView = CompositeView.extend({
    template: searchViewTemplate,
    events: {
        'submit': 'firstSearch',
    },
    subviews: [{
        view: 'alert',
        method: 'prepend',
    }],
    /**
     * The identifier of the source that will be used to search in, either
     * a catalogue or a collection.
     * @type {?string}
     */
    source: null,
    renderContainer: function() {
        this.$el.html(this.template());
        return this;
    },
    showPending: function() {
        this.$('form button').first().text('Searching...');
        return this;
    },
    showIdle: function() {
        this.$('form button').first().text('Search');
        return this;
    },
    submitSearch: function(startRecord) {
        this.showPending();
        var searchTerm = this.$('input').val();
        var searchPromise = this.collection.query({
            params: {
                catalog: this.source,
                query: searchTerm,
                start: startRecord,
            },
            error: _.bind(this.alertError, this),
        });
        searchPromise.always(this.showIdle.bind(this));
        return searchPromise;
    },
    alertError: function(collection, response, options) {
        this.alert = new AlertView({
            level: 'warning',
            message: failedSearchTemplate(response),
        });
        this.alert.once('removed', this.deleteAlert, this);
        this.placeSubviews();
        this.alert.animateIn();
    },
    deleteAlert: function() { delete this.alert; },
    firstSearch: function(event){
        event.preventDefault();
        // Start with record 0, which is what the EDPOP VRE API expects
        this.submitSearch(0).then(_.bind(function() {
            $('#more-records').show();
            GlobalVariables.records.reset(this.collection.models);
            if (!document.contains(GlobalVariables.recordsList.$el[0])) {
                // records list is initialized and rendered but not yet added to DOM
                GlobalVariables.recordsList.$el.insertAfter($('.page-header'));
            }
            this.feedback();
        }, this));
    },
    nextSearch: function(event) {
        event.preventDefault();
        $('#more-records').hide();
        var startRecord = GlobalVariables.records.length;
        this.submitSearch(startRecord).then( _.bind(function() {
            GlobalVariables.records.add(this.collection.models);
            this.feedback();
        }, this));
    },
    feedback: function() {
        if (GlobalVariables.records.length === this.collection.totalResults) {
            GlobalVariables.records.trigger('complete');
        } else {
            $('#more-records').show();
        }
        $('#search-feedback').text("Showing " + GlobalVariables.records.length + " of " + this.collection.totalResults + " results");
    },
    fill: function(fillText) {
        this.$('#query-input').val(fillText);
    },
});
