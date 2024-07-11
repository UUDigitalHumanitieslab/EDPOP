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
import { WelcomeView } from './utils/welcome.view.js';


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
});

var router = new VRERouter();

// We create some hooks between triggers and effects.
// Firstly, route changes should lead to different models moving to the center
// of attention.
router.on({
    'route:showCollection': id => navigationState.set(
        'browsingContext', GlobalVariables.myCollections.get(id)),
    'route:showCatalog': id => navigationState.set(
        'browsingContext', catalogs.findWhere({identifier: id})),
});

// Focus/blur semantics for the catalog or collection currently being viewed.
navigationState.on({
    'enter:browsingContext': (model, newValue) => newValue.trigger('focus', newValue),
    'exit:browsingContext': (model, oldValue) => oldValue.trigger('blur', oldValue),
    'enter:browser': (model, newValue) => newValue.$el.appendTo('#content'),
    'exit:browser': (model, oldValue) => oldValue.remove(),
});

// We use different browser views depending on whether the model currently under
// attention is a catalog or a (VRE) collection. Also, there is still some
// residual code that depends on there being a global variable holding the
// currently selected collection.
catalogs.on({
    focus: catalog => navigationState.set(
        'browser', new CollectionSearchView({model: catalog})),
});

function showCollection(vreCollection) {
    GlobalVariables.currentVRECollection = vreCollection;
    navigationState.set(
        'browser', new BrowseCollectionView({model: vreCollection}));
}

GlobalVariables.myCollections.on({
    focus: showCollection,
    blur: () => GlobalVariables.currentVRECollection = null,
});

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
    // Show the welcome view
    navigationState.set('browser', new WelcomeView);
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
