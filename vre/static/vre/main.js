import _ from 'lodash';
import $ from 'jquery';
import Backbone from 'backbone';
import Handlebars from 'handlebars';
import { Records } from './record/record.model';
import { RecordListView } from './record/record.list.view';
import { RecordDetailView } from './record/record.detail.view';
import { VRECollections } from './collection/collection.model';
import { ResearchGroups } from './group/group.model';
import { GroupMenuView } from './group/group.menu.view';
import { SearchResults } from './search/search.model';
import { SearchView, AdvancedSearchView } from './search/search.view';
import { SelectSourceView } from './select-source/select-source.view';
import { addCSRFToken } from './utils/generic-functions';
import { myCollections } from './globals/myCollections';
import { JST } from './globals/templates';

var VRERouter = Backbone.Router.extend({
    routes: {
        ':id/': 'showDatabase',
    },
    showDatabase: function(id) {
        searchView.render();
        searchView.$el.appendTo($('.page-header').first());
        // The if-condition is a bit of a hack, which can go away when we
        // convert to client side routing entirely.
        if (id=="hpb") {
            $('#HPB-info').show();
            var advancedSearchView = new AdvancedSearchView();
            advancedSearchView.render();
            searchView.listenTo(advancedSearchView, 'fill', searchView.fill);
            $('#search-info').show();
            $('#search-info').popover({
                'html': true,
                'content': JST['hpb-search-info'](),
                'container': 'body',
                'placement': 'left'
            });
        }
        else {
            // We are not on the HPB search page, so display the
            // records in the current collection.
            $('#HPB-info').hide();
            currentVRECollection = myCollections.get(id);
            records = currentVRECollection.getRecords();
            recordsList.remove();
            recordsList = new RecordListView({collection: records});
            recordsList.render().$el.insertAfter($('.page-header'));
        }
        searchView.source = id;
    },
});

// Global object to hold the templates, initialized at page load below.
var currentVRECollection;
var records = new Records();
var allCollections = new VRECollections();
var allGroups = new ResearchGroups();
var myGroups, groupMenu;
var recordDetailModal;
var dropDown;
var recordsList = new RecordListView({collection: records});
var results = new SearchResults();
var searchView  = new SearchView();
var router = new VRERouter();

// Override Backbone.sync so it always includes the CSRF token in requests.
(function() {
    var id = _.identity;
    Backbone.sync = _.overArgs(Backbone.sync, [id, id, addCSRFToken]);
}());

function prepareCollectionViews() {
    recordDetailModal = new RecordDetailView();
    dropDown = new SelectSourceView({collection:myCollections});
    dropDown.$el.appendTo($('.nav').first());
}

$(function() {
    $('script[type="text/x-handlebars-template"]').each(function(i, element) {
        var $el = $(element);
        JST[$el.prop('id')] = Handlebars.compile($el.html(), {compat: true});
    });
    $('#result_detail').modal({show: false});
    // We fetch the collections and ensure that we have them before we handle
    // the route, because VRERouter.showCollection depends on them being
    // available. This is something we can definitely improve upon.
    allCollections.fetch().then(function() {
        Backbone.history.start({
            pushState: true,  // this enables matching the path of the URL hashchange
            root: '/vre/',
        });
    });
    allGroups.fetch();
    myGroups = ResearchGroups.mine();
    groupMenu = new GroupMenuView({collection: myGroups});
    if (myCollections.length) {
        prepareCollectionViews();
    } else {
        myCollections.on("sync", prepareCollectionViews);
    }
});
