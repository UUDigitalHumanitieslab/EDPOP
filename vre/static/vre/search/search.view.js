import { LazyTemplateView } from '../utils/lazy.template.view';
import { AlertView } from '../alert/alert.view';

export var SearchView = LazyTemplateView.extend({
    templateName: "search-view",
    events: {
        'submit': 'firstSearch',
    },
    render: function() {
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
        var myElement = this.el;
        var searchTerm = this.$('input').val();
        var searchPromise = results.query(
            {params:{search:searchTerm, source:this.source, startRecord:startRecord},
            error: function(collection, response, options) {
                var alert = new AlertView({
                    level: 'warning',
                    message: JST['failed-search-message'](response),
                });
                alert.render().$el.insertAfter('.page-header');
                alert.animateIn();
            },
        });
        searchPromise.always(this.showIdle.bind(this));
        return searchPromise;
    },
    firstSearch: function(event){
        event.preventDefault();
        this.submitSearch(1).then(_.bind(function() {
            $('#more-records').show();
            records.reset(results.models);
            if (!document.contains(recordsList.$el[0])) {
                // records list is initialized and rendered but not yet added to DOM
                recordsList.$el.insertAfter($('.page-header'));
            }
            this.feedback();
        }, this));
    },
    nextSearch: function(event) {
        event.preventDefault();
        $('#more-records').hide();
        var startRecord = records.length+1;
        this.submitSearch(startRecord).then( _.bind(function() {
            records.add(results.models);
            this.feedback();
        }, this));
    },
    feedback: function() {
        if (records.length === results.total_results) {
            records.trigger('complete');
        } else {
            $('#more-records').show();
        }
        $('#search-feedback').text("Showing "+records.length+" of "+results.total_results+" results");
    },
    fill: function(fillText) {
        this.$('#query-input').val(fillText);
    },
});

export var AdvancedSearchView = LazyTemplateView.extend({
    templateName: 'hpb-search-info',
    events: {
        'click a': 'fill',
    },
    render: function() {
        $('#search-info').show();
        $('#search-info').popover({
            'html': true, 
            'content': this.$el.html(this.template()), 
            'container': 'body', 
            'placement': 'left'
        });
    },
    fill: function(event) {
        event.preventDefault();
        fillIn = event.target.textContent.slice(0, -9);
        this.trigger('fill', fillIn);
    },
});