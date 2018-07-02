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
//import { myCollections } from './globals/myCollections';
import { JST } from './globals/templates';
import { GlobalVariables } from './globals/variables';


// Global variables
GlobalVariables.records = new Records();
GlobalVariables.recordsList = new RecordListView({collection: GlobalVariables.records});
GlobalVariables.allGroups = new ResearchGroups();
GlobalVariables.results = new SearchResults();
GlobalVariables.searchView  = new SearchView();


// Override Backbone.sync so it always includes the CSRF token in requests.
(function() {
    var id = _.identity;
    Backbone.sync = _.overArgs(Backbone.sync, [id, id, addCSRFToken]);
}());

var VRERouter = Backbone.Router.extend({
    routes: {
        ':id/': 'showDatabase',
    },
    showDatabase: function(id) {
        GlobalVariables.searchView.render();
        GlobalVariables.searchView.$el.appendTo($('.page-header').first());
        // The if-condition is a bit of a hack, which can go away when we
        // convert to client side routing entirely.
        if (id=="hpb") {
            $('#HPB-info').show();
            var advancedSearchView = new AdvancedSearchView();
            advancedSearchView.render();
            GlobalVariables.searchView.listenTo(advancedSearchView, 'fill', GlobalVariables.searchView.fill);
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
            GlobalVariables.currentVRECollection = GlobalVariables.myCollections.get(id);
            GlobalVariables.records = GlobalVariables.currentVRECollection.getRecords();
            GlobalVariables.recordsList.remove();
            GlobalVariables.recordsList = new RecordListView({collection: GlobalVariables.records});
            GlobalVariables.recordsList.render().$el.insertAfter($('.page-header'));
        }
        GlobalVariables.searchView.source = id;
    },
});

function prepareCollectionViews() {
    GlobalVariables.recordDetailModal = new RecordDetailView();
    GlobalVariables.dropDown = new SelectSourceView({collection: GlobalVariables.myCollections});
    GlobalVariables.dropDown.$el.appendTo($('.nav').first());
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
    var allCollections = new VRECollections();
    allCollections.fetch().then(function() {
        Backbone.history.start({
            pushState: true,  // this enables matching the path of the URL hashchange
            root: '/vre/',
        });
    });
    GlobalVariables.myCollections = VRECollections.mine();
    GlobalVariables.allGroups.fetch();
    var myGroups = ResearchGroups.mine();
    GlobalVariables.groupMenu = new GroupMenuView({collection: myGroups});
    if (GlobalVariables.myCollections.length) {
        prepareCollectionViews();
    } else {
        GlobalVariables.myCollections.on("sync", prepareCollectionViews);
    }
    var router = new VRERouter();
});
