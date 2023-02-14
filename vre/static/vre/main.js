import _ from 'lodash';
import $ from 'jquery';
import Backbone from 'backbone';
import { Records } from './record/record.model';
import { RecordListView } from './record/record.list.view';
import { RecordDetailView } from './record/record.detail.view';
import { BlankRecordButtonView } from './record/blank.record.button.view';
import { VRECollections } from './collection/collection.model';
import { SRUView } from './database/sru.view';
import { CollectionView } from './database/collection.view';
import { ResearchGroups } from './group/group.model';
import { GroupMenuView } from './group/group.menu.view';
import { SearchResults } from './search/search.model';
import { SearchView } from './search/search.view';
import { AdvancedSearchView } from './search/advanced.search.view';
import { SelectDatabaseView } from './database/select-db.view';
import { addCSRFToken } from './utils/generic-functions';
import { GlobalVariables } from './globals/variables';


// Global variables
GlobalVariables.records = new Records();
GlobalVariables.recordsList = new RecordListView({collection: GlobalVariables.records});
GlobalVariables.allGroups = new ResearchGroups();
GlobalVariables.results = new SearchResults();
GlobalVariables.searchView  = new SearchView({model: GlobalVariables.results});
GlobalVariables.blankRecordButton = new BlankRecordButtonView();

const SRUIDS = ['hpb', 'vd16', 'vd17', 'vd18', 'gallica', 'cerl-thesaurus'];

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
        GlobalVariables.searchView.source = id;
        GlobalVariables.searchView.render();
        if (SRUIDS.includes(id)) {
            //$('#content').empty();
            var sruView = new SRUView();
            GlobalVariables.searchView.$el.appendTo(sruView.$('.page-header'));
            $('#content').replaceWith(sruView.$el);
            var advancedSearchView = new AdvancedSearchView();
            advancedSearchView.render();
            GlobalVariables.searchView.listenTo(advancedSearchView, 'fill', GlobalVariables.searchView.fill);
        }
        else {
            // We are not on the HPB search page, so display the
            // records in the current collection.
            $('#HPB-info').hide();
            GlobalVariables.currentVRECollection = GlobalVariables.myCollections.get(id);
            var collectionView = new CollectionView({model:GlobalVariables.currentVRECollection});
            GlobalVariables.searchView.$el.appendTo(collectionView.$('.page-header'));
            $('#content').replaceWith(collectionView.$el);
            GlobalVariables.records = GlobalVariables.currentVRECollection.getRecords();
 			      GlobalVariables.recordsList.remove();
            GlobalVariables.recordsList = new RecordListView({collection: GlobalVariables.records});
    		GlobalVariables.recordsList.render().$el.insertAfter($('.page-header'));
        }
    },
});

function prepareCollectionViews() {
    GlobalVariables.recordDetailModal = new RecordDetailView();
    GlobalVariables.dropDown = new SelectDatabaseView({collection: GlobalVariables.myCollections});
    $('.nav').first().append(
        GlobalVariables.dropDown.el,
        GlobalVariables.blankRecordButton.el,
    );
}

function startRouting() {
    prepareCollectionViews();
    Backbone.history.start({
        pushState: true,
        root: '/vre/',
    });
}

$(function() {
    $('#result-detail').modal({show: false});
    GlobalVariables.myCollections = VRECollections.mine();
    GlobalVariables.allGroups.fetch();
    var myGroups = ResearchGroups.mine();
    GlobalVariables.groupMenu = new GroupMenuView({collection: myGroups});
    GlobalVariables.router = new VRERouter();
    var finish = _.after(2, startRouting);
    GlobalVariables.myCollections.on('update', finish);
    GlobalVariables.allGroups.on('update', finish);
});
