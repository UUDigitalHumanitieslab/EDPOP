import _ from 'lodash';
import $ from 'jquery';
import Backbone from 'backbone';
import Cookies from 'jscookie';

import './record/record.opening.aspect';
import { vreChannel } from './radio';
import { Records } from './record/record.model';
import { RecordListManagingView } from './record/record.list.managing.view';
import { BlankRecordButtonView } from './record/blank.record.button.view';
import { VRECollections } from './collection/collection.model';
import { CollectionSearchView } from './catalog/collection.search.view';
import { BrowseCollectionView } from './collection/browse-collection.view';
import { ResearchGroups } from './group/group.model';
import { GroupMenuView } from './group/group.menu.view';
import { SearchResults } from './search/search.model';
import { SearchView } from './search/search.view';
import { AdvancedSearchView } from './search/advanced.search.view';
import { SelectCollectionView } from './collection/select-collection.view';
import { addCSRFToken } from './utils/generic-functions';
import { GlobalVariables } from './globals/variables';
import './globals/user';
import { accountMenu } from './globals/accountMenu';
import {Catalogs} from "./catalog/catalog.model";
import {SelectCatalogView} from "./catalog/select-catalog.view";


// Global variables
GlobalVariables.records = new Records();
GlobalVariables.allGroups = new ResearchGroups();
GlobalVariables.results = new SearchResults();
GlobalVariables.searchView  = new SearchView({model: GlobalVariables.results});
GlobalVariables.blankRecordButton = new BlankRecordButtonView();
GlobalVariables.myCollections = new VRECollections();
GlobalVariables.catalogs = new Catalogs();

const SRUIDS = ['hpb', 'vd16', 'vd17', 'vd18', 'gallica', 'cerl-thesaurus'];

// Override Backbone.sync so it always includes the CSRF token in requests.
(function() {
    var id = _.identity;
    Backbone.sync = _.overArgs(Backbone.sync, [id, id, addCSRFToken]);
}());

var VRERouter = Backbone.Router.extend({
    routes: {
        'collection/:id/': 'showCollection',
        'catalog/:id/': 'showCatalog',
    },
    showCollection: function(id) {
        GlobalVariables.searchView.source = id;
        GlobalVariables.searchView.render();
        // We are not on the HPB search page, so display the
        // records in the current collection.
        $('#HPB-info').hide();
        GlobalVariables.currentVRECollection = GlobalVariables.myCollections.get(id);
        GlobalVariables.currentCatalog = null;
        GlobalVariables.collectionDropdown.render();
        GlobalVariables.catalogDropdown.render();
        var collectionView = new BrowseCollectionView({model:GlobalVariables.currentVRECollection});
        GlobalVariables.searchView.$el.appendTo(collectionView.$('.page-header'));
        $('#content').replaceWith(collectionView.$el);
        GlobalVariables.records = GlobalVariables.currentVRECollection.getRecords();
        GlobalVariables.recordsList.remove();
        GlobalVariables.recordsList = new RecordListManagingView({
            collection: GlobalVariables.records,
        });
        GlobalVariables.recordsList.render().$el.insertAfter($('.page-header'));
    },
    showCatalog: function(id) {
        GlobalVariables.currentCatalog = GlobalVariables.catalogs.findWhere({
            identifier: id,
        });
        GlobalVariables.currentVRECollection = null;
        GlobalVariables.collectionDropdown.render();
        GlobalVariables.catalogDropdown.render();
        const catalogView = new CollectionSearchView({
            model: GlobalVariables.currentCatalog,
        });
        GlobalVariables.searchView.$el.appendTo(catalogView.$('.page-header'));
        $('#content').replaceWith(catalogView.$el);
    },
});

// We want this code to run after two conditions are met:
// 1. The DOM has fully loaded;
// 2. the CSRF cookie has been obtained.
function prepareCollections() {
    $('#result-detail').modal({show: false});
    VRECollections.mine(GlobalVariables.myCollections);
    GlobalVariables.catalogs.fetch();
    GlobalVariables.recordsList = new RecordListManagingView({
        collection: GlobalVariables.records,
    });
    GlobalVariables.allGroups.fetch();
    var myGroups = ResearchGroups.mine();
    GlobalVariables.groupMenu = new GroupMenuView({collection: myGroups});
    GlobalVariables.router = new VRERouter();
    GlobalVariables.myCollections.on('update', finish);
    GlobalVariables.allGroups.on('update', finish);
    GlobalVariables.catalogs.on('update', finish);

    // Add account menu
    accountMenu.$el.appendTo('#navbar-right');
}

// We want this code to run after prepareCollections has run and both
// GlobalVariables.myCollections and GlobalVariables.allGroups have fully
// loaded.
function startRouting() {
    GlobalVariables.catalogDropdown = new SelectCatalogView({
        collection: GlobalVariables.catalogs
    });
    GlobalVariables.collectionDropdown = new SelectCollectionView({
        collection: GlobalVariables.myCollections
    });
    $('.nav').first().append(
        GlobalVariables.catalogDropdown.el,
        GlobalVariables.collectionDropdown.el,
        GlobalVariables.blankRecordButton.el,
    );
    Backbone.history.start({
        pushState: true,
        root: '/',
    });
}

// _.after ensures that a function runs only after a given number of calls.
var kickoff = _.after(2, prepareCollections);
var finish = _.after(3, startRouting);

// Ensure we have a CSRF cookie.
if (Cookies.get('csrftoken')) {
    kickoff();
} else {
    $.ajax({url: '/accounts/login/'}).then(kickoff);
}

// Ensure the DOM has fully loaded.
$(kickoff);
