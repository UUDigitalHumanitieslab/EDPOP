import { CompositeView } from 'backbone-fractal';

import { AlertView } from '../alert/alert.view';
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
    initialize: function() {
        this.render().listenTo(this.collection, {
            moreRequested: this.nextSearch,
        });
    },
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
        var searchPromise = this.collection.query({
            params: {
                search: searchTerm,
                source: this.model.id,
                startRecord: startRecord,
            },
            error: _.bind(this.alertError, this),
            remove: startRecord === 1,
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
            this.feedback();
        }, this));
    },
    nextSearch: function(event) {
        event.preventDefault();
        $('#more-records').hide();
        var startRecord = this.collection.length+1;
        this.submitSearch(startRecord).then(this.feedback.bind(this));
    },
    feedback: function() {
        if (this.collection.length >= this.collection.total_results) {
            this.collection.trigger('complete');
        } else {
            $('#more-records').show();
        }
        $('#search-feedback').text("Showing " + this.collection.length + " of " + this.collection.total_results + " results");
    },
    fill: function(fillText) {
        this.$('#query-input').val(fillText);
    },
});
