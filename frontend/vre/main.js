import _ from 'lodash';
import $ from 'jquery';
import Backbone from 'backbone';
import Cookies from 'jscookie';

import './record/record.opening.aspect';
import { vreChannel } from './radio';
import { BlankRecordButtonView } from './record/blank.record.button.view';
import { VRECollections } from './collection/collection.model';
import { CollectionSearchView } from './catalog/collection.search.view';
import { BrowseCollectionView } from './collection/browse-collection.view';
import { ResearchGroups } from './group/group.model';
import { GroupMenuView } from './group/group.menu.view';
import { SelectCollectionView } from './collection/select-collection.view';
import { addCSRFToken } from './utils/generic-functions';
import { GlobalVariables } from './globals/variables';
import './globals/user';
import { accountMenu } from './globals/accountMenu';
import {Catalogs} from "./catalog/catalog.model";
import {SelectCatalogView} from "./catalog/select-catalog.view";
import { StateModel } from './utils/state.model.js';


// Dangerously global variables (accessible from dependency modules).
GlobalVariables.allGroups = new ResearchGroups();
GlobalVariables.myCollections = new VRECollections();

// Regular global variables, only visible in this module.
var blankRecordButton = new BlankRecordButtonView();
var catalogs = new Catalogs([], {comparator: 'name'});
var catalogDropdown = new SelectCatalogView({
    collection: catalogs
});
var collectionDropdown = new SelectCollectionView({
    collection: GlobalVariables.myCollections
});
var navigationState = new StateModel;

// Focus/blur semantics for the catalog or collection currently being viewed.
navigationState.on({
    'enter:browsingContext': (model, newValue) => newValue.trigger('focus', newValue),
    'exit:browsingContext': (model, oldValue) => oldValue.trigger('blur', oldValue),
});

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
        // We are not on the HPB search page, so display the
        // records in the current collection.
        $('#HPB-info').hide();
        GlobalVariables.currentVRECollection = GlobalVariables.myCollections.get(id);
        var collectionView = new BrowseCollectionView({model:GlobalVariables.currentVRECollection});
        $('#content').replaceWith(collectionView.$el);
        navigationState.set('browsingContext', GlobalVariables.currentVRECollection);
    },
    showCatalog: function(id) {
        var currentCatalog = catalogs.findWhere({
            identifier: id,
        });
        GlobalVariables.currentVRECollection = null;
        const catalogView = new CollectionSearchView({
            model: currentCatalog,
        });
        $('#content').replaceWith(catalogView.$el);
        navigationState.set('browsingContext', currentCatalog);
    },
});

var router = new VRERouter();

// We want this code to run after two conditions are met:
// 1. The DOM has fully loaded;
// 2. the CSRF cookie has been obtained.
function prepareCollections() {
    $('#result-detail').modal({show: false});
    VRECollections.mine(GlobalVariables.myCollections);
    catalogs.fetch();
    GlobalVariables.allGroups.fetch();
    var myGroups = ResearchGroups.mine();
    GlobalVariables.groupMenu = new GroupMenuView({collection: myGroups});
    GlobalVariables.myCollections.on('update', finish);
    GlobalVariables.allGroups.on('update', finish);
    catalogs.on('update', finish);

    // Add account menu
    accountMenu.$el.appendTo('#navbar-right');
}

// We want this code to run after prepareCollections has run and both
// myCollections and allGroups have fully
// loaded.
function startRouting() {
    $('.nav').first().append(
        catalogDropdown.el,
        collectionDropdown.el,
        blankRecordButton.el,
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
