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
        selector: '.page-header',
        method: 'after',
    }],
    renderContainer: function() {
        this.$el.html(this.template());
        return this;
    },
    showPending: function() {
        this.$('button').first().text('Searching...');
        return this;
    },
    showIdle: function() {
        this.$('button').first().text('Search');
        return this;
    },
    submitSearch: function(startRecord) {
        this.showPending();
        var searchTerm = this.$('input').val();
        var searchPromise = GlobalVariables.results.query({
            params: {
                search: searchTerm,
                source: this.source,
                startRecord: startRecord,
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
        }).once('removed', this.deleteAlert, this);
        this.placeSubviews();
        this.alert.animateIn();
    },
    deleteAlert: function() { delete this.alert; },
    firstSearch: function(event){
        event.preventDefault();
        this.submitSearch(1).then(_.bind(function() {
            $('#more-records').show();
            GlobalVariables.records.reset(GlobalVariables.results.models);
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
        var startRecord = GlobalVariables.records.length+1;
        this.submitSearch(startRecord).then( _.bind(function() {
            GlobalVariables.records.add(GlobalVariables.results.models);
            this.feedback();
        }, this));
    },
    feedback: function() {
        if (GlobalVariables.records.length === GlobalVariables.results.total_results) {
            GlobalVariables.records.trigger('complete');
        } else {
            $('#more-records').show();
        }
        $('#search-feedback').text("Showing " + GlobalVariables.records.length + " of " + GlobalVariables.results.total_results + " results");
    },
    fill: function(fillText) {
        this.$('#query-input').val(fillText);
    },
});
