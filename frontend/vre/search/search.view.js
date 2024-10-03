import { CompositeView } from '../core/view.js';

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
        method: 'prepend',
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
                source: this.model.id,
                query: searchTerm,
                start: startRecord,
            },
            error: _.bind(this.alertError, this),
            remove: startRecord === 0, // Remove current records if search starts at zero
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
            this.feedback();
        }, this));
    },
    nextSearch: function(event) {
        event.preventDefault();
        $('#more-records').hide();
        var startRecord = this.collection.length;
        this.submitSearch(startRecord).then(this.feedback.bind(this));
    },
    feedback: function() {
        if (this.collection.length >= this.collection.totalResults) {
            this.collection.trigger('complete');
        } else {
            $('#more-records').show();
        }
        $('#search-feedback').text("Showing " + this.collection.length + " of " + this.collection.totalResults + " results");
    },
    fill: function(fillText) {
        this.$('#query-input').val(fillText);
    },
});
