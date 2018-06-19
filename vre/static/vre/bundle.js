(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.AdditionsToCollections = undefined;

var _backbone = (typeof window !== "undefined" ? window['_backbone'] : typeof global !== "undefined" ? global['_backbone'] : null);

var AdditionsToCollections = exports.AdditionsToCollections = _backbone.Backbone.Model.extend({
    url: '/vre/add-selection'
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.AlertView = undefined;

var _lazyTemplate = require('../utils/lazy.template.view');

/**
 * Reusable alert view. Meant to be displayed once and then discarded.
 *
 * The methods with a `complete` parameter accept three types of values:
 *
 *  1. any function, which will be executed after the animation completes;
 *  2. a string, which should be the name of a method of the alert view;
 *  3. undefined, in which case nothing is done after the animation completes.
 */
var AlertView = exports.AlertView = _lazyTemplate.LazyTemplateView.extend({
    ease: 500,
    delay: 2000,
    className: 'alert alert-dismissible',
    templateName: 'alert-view',
    attributes: {
        role: 'alert'
    },
    initialize: function initialize(options) {
        _.assign(this, _.pick(options, ['level', 'message', 'ease', 'delay']));
    },
    render: function render() {
        this.$el.addClass(this.getLevelClass()).html(this.template(this));
        return this;
    },
    // Show and hide automatically, then execute `complete`.
    animate: function animate(complete) {
        var followUp = _.bind(this.animateOut, this, complete);
        // The _.partial(...) below is a shorthand for _.bind(function() {
        //     _.delay(followUp, this.delay);
        // }, this), where _.delay in turn is a shorthand for setTimeout.
        return this.animateIn(_.partial(_.delay, followUp, this.delay));
    },
    // Show with ease and then execute `complete`.
    animateIn: function animateIn(complete) {
        this.$el.show(this.ease, this.wrapComplete(complete));
        return this;
    },
    // Hide with ease and then execute `complete`.
    animateOut: function animateOut(complete) {
        this.$el.hide(this.ease, this.wrapComplete(complete));
        return this;
    },
    getLevelClass: function getLevelClass() {
        return 'alert-' + this.level;
    },
    // Utility function that enables the "string as method name" magic.
    wrapComplete: function wrapComplete(complete) {
        return this[complete] && this[complete].bind(this) || complete;
    }
});
},{"../utils/lazy.template.view":22}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.AnnotationEditView = undefined;

var _lazyTemplate = require('../utils/lazy.template.view');

var AnnotationEditView = exports.AnnotationEditView = _lazyTemplate.LazyTemplateView.extend({
    tagName: 'tr',
    className: 'form-inline',
    templateName: 'field-list-item-edit',
    events: {
        'submit': 'submit',
        'reset': 'reset'
    },
    initialize: function initialize(options) {
        _.assign(this, _.pick(options, ['existing']));
    },
    render: function render() {
        this.$el.html(this.template(_.extend({ cid: this.cid }, this.model.attributes)));
        return this;
    },
    submit: function submit(event) {
        event.preventDefault();
        var model = this.model;
        this.$('input').each(function (index, element) {
            model.set(this.name, $(this).val());
        });
        this.trigger('save', this);
    },
    reset: function reset(event) {
        event.preventDefault();
        this.trigger('cancel', this);
    }
});
},{"../utils/lazy.template.view":22}],4:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.FlatAnnotations = exports.Annotations = undefined;

var _backbone = (typeof window !== "undefined" ? window['_backbone'] : typeof global !== "undefined" ? global['_backbone'] : null);

var _api = require('../utils/api.model');

var _genericFunctions = require('../utils/generic-functions');

var Annotations = exports.Annotations = _api.APICollection.extend({
    url: '/vre/api/annotations'
});

var FlatAnnotations = exports.FlatAnnotations = _backbone.Backbone.Collection.extend({
    // comparator: can be set to keep this sorted
    // How to uniquely identify a field annotation.
    comparator: function comparator(item) {
        return (0, _genericFunctions.canonicalSort)(item.attributes.key);
    },
    modelId: function modelId(attributes) {
        return attributes.key + ':' + attributes.group;
    },
    initialize: function initialize(models, options) {
        _.assign(this, _.pick(options, ['record']));
        this.underlying = this.record.getAnnotations();
        this.underlying.forEach(this.toFlat.bind(this));
        this.markedGroups = new _backbone.Backbone.Collection([]);
        this.listenTo(this.underlying, 'add change:content', this.toFlat);
        this.on('add change:value', this.markGroup);
        this.markedGroups.on('add', _.debounce(this.fromFlat), this);
        // this.listenTo(this.underlying, 'remove', TODO);
        // this.on('remove', TODO);
    },
    // translate the official representation to the flat one
    toFlat: function toFlat(annotation) {
        if (annotation.isNew() || annotation.hasChanged()) {
            // Store the annotation either immediately or on record save.
            if (this.record.isNew()) {
                this.listenToOnce(annotation, 'change:record', function () {
                    annotation.save(null, { silent: true });
                });
            } else annotation.save(null, { silent: true });
        }
        var id = annotation.id,
            groupId = annotation.get('managing_group'),
            groupName = allGroups.get(groupId).get('name'),
            content = annotation.get('content'),
            existing = _.map(this.filter({ group: groupName }), 'attributes'),
            replacements = _.map(content, function (value, key) {
            return { id: id, key: key, value: value, group: groupName };
        }),
            obsolete = _.differenceBy(existing, replacements, this.modelId);
        // After the next two lines, this.models will be up-to-date and
        // appropriate events will have been triggered.
        this.remove(obsolete);
        this.add(replacements, { merge: true });
    },
    markGroup: function markGroup(flatAnnotation) {
        this.markedGroups.add({ id: flatAnnotation.get('group') });
    },
    // translate the flat representation to the official one, save immediately
    fromFlat: function fromFlat() {
        var flat = this,
            record = flat.record,
            recordId = record.id,
            flatPerGroup = flat.groupBy('group');
        var newContent = flat.markedGroups.map('id').map(function (groupName) {
            var groupId = allGroups.findWhere({ name: groupName }).id,
                existing = flat.underlying.findWhere({ managing_group: groupId }),
                id = existing && existing.id,
                content = _(flatPerGroup[groupName]).map(function (model) {
                return [model.get('key'), model.get('value')];
            }).fromPairs().value();
            return {
                id: id,
                record: recordId,
                managing_group: groupId,
                content: content
            };
        });
        // At least one annotation exists, so now is the time to ensure
        // the VRE knows the record.
        if (record.isNew()) record.save().then(function () {
            _.invokeMap(flat.underlying.models, 'set', 'record', record.id);
        });
        flat.underlying.add(newContent, { merge: true });
        flat.markedGroups.reset();
    }
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../utils/api.model":20,"../utils/generic-functions":21}],5:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.VRECollections = exports.VRECollection = undefined;

var _backbone = (typeof window !== "undefined" ? window['_backbone'] : typeof global !== "undefined" ? global['_backbone'] : null);

var _api = require('../utils/api.model');

/**
 * Representation of a single VRE collection.
 */
var VRECollection = exports.VRECollection = _backbone.Backbone.Model.extend({
    getRecords: function getRecords() {
        if (!this.records) {
            var records = this.records = new Records();
            records.query({
                params: { collection__id: this.id }
            }).then(function () {
                records.trigger('complete');
            });
        }
        return records;
    }
});

var VRECollections = exports.VRECollections = _api.APICollection.extend({
    url: '/vre/api/collections',
    model: VRECollection
}, {
    /**
     * Class method for retrieving only the collections the user can manage.
     */
    mine: function mine() {
        var myCollections = new VRECollections();
        myCollections.fetch({ url: myCollections.url + '/mine' });
        return myCollections;
    }
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../utils/api.model":20}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.VRECollectionView = undefined;

var _lazyTemplate = require('../utils/lazy.template.view');

var _alert = require('../alert/alert.view');

var _additionsToCollections = require('../additions/additions-to-collections');

var VRECollectionView = exports.VRECollectionView = _lazyTemplate.LazyTemplateView.extend({
    templateName: 'collection-selector',
    events: {
        'click button': 'submitForm',
        'change select': 'activateButton'
    },
    render: function render() {
        var shownCollections = this.collection.clone();
        shownCollections.remove(currentVRECollection);
        this.$el.html(this.template({ models: shownCollections.toJSON() }));
        this.$('select').select2();
        return this;
    },
    setRecord: function setRecord(model) {
        this.model = model;
        return this;
    },
    clear: function clear() {
        this.$el.val(null).trigger('change');
        return this;
    },
    activateButton: function activateButton(event) {
        event.preventDefault();
        if (this.$('select').val().length) {
            this.$('button').removeClass("disabled");
        } else {
            this.$('button').addClass("disabled");
        }
    },
    submitForm: function submitForm(event) {
        event.preventDefault();
        var selected_records = [];
        if (this.model) {
            // adding to array as the api expects an array.
            selected_records.push(this.model.toJSON());
        } else {
            selected_records = _(recordsList.items).filter({ selected: true }).invokeMap('model.toJSON').value();
        }
        var selected_collections = this.$('select').val();
        var records_and_collections = new _additionsToCollections.AdditionsToCollections({
            'records': selected_records,
            'collections': selected_collections
        });
        records_and_collections.save().then(this.showSuccess.bind(this), this.showError.bind(this));
    },
    showSuccess: function showSuccess(response) {
        var feedbackString = '';
        $.each(response, function (key, value) {
            feedbackString = feedbackString.concat('Added ', value, ' record(s) to ', key, ". ");
        });
        this.showAlert('success', feedbackString);
    },
    showError: function showError(response) {
        this.showAlert('warning', response.responseJSON.error);
    },
    showAlert: function showAlert(level, message) {
        var alert = new _alert.AlertView({ level: level, message: message });
        alert.render().$el.prependTo(this.el);
        alert.animate('remove');
    }
});
},{"../additions/additions-to-collections":1,"../alert/alert.view":2,"../utils/lazy.template.view":22}],7:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.FlatFields = exports.Field = undefined;

var _backbone = (typeof window !== "undefined" ? window['_backbone'] : typeof global !== "undefined" ? global['_backbone'] : null);

var _backbone2 = _interopRequireDefault(_backbone);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// A single field of a single record.
var Field = exports.Field = _backbone2.default.Model.extend({
    idAttribute: 'key'
});

/**
 * This is an alternative, flat representation of the fields in a given
 * option.record. Its purpose is to be easier to represent and manage from
 * a view.
 *
 * normal: {id, uri, content}
 * flat alternative: [{key, value}]
 *
 * Note that we extend directly from Backbone.Collection rather than from
 * APICollection and that we don't set a URL. This is because we only talk
 * to the server through the underlying Record model.
 */
var FlatFields = exports.FlatFields = _backbone2.default.Collection.extend({
    model: Field,
    comparator: function comparator(item) {
        return canonicalSort(item.attributes.key);
    },
    initialize: function initialize(models, options) {
        _.assign(this, _.pick(options, ['record']));
        if (this.record.has('content')) this.set(this.toFlat(this.record));
        // Do the above line again when the record changes.
        this.listenTo(this.record, 'change', _.flow([this.toFlat, this.set]));
    },
    toFlat: function toFlat(record) {
        return _.map(record.get('content'), function (value, key) {
            return { key: key, value: value };
        });
    }
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],8:[function(require,module,exports){
'use strict';

var _lazyTemplate = require('../utils/lazy.template.view');

/**
 * Displays a single model from a FlatFields or FlatAnnotations collection.
 */
var FieldView = _lazyTemplate.LazyTemplateView.extend({
    tagName: 'tr',
    templateName: 'field-list-item',
    events: {
        'click': 'edit'
    },
    initialize: function initialize(options) {
        this.listenTo(this.model, 'change:value', this.render);
    },
    render: function render() {
        this.$el.html(this.template(this.model.attributes));
        return this;
    },
    edit: function edit(event) {
        this.trigger('edit', this.model);
    }
});
},{"../utils/lazy.template.view":22}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.RecordAnnotationsView = exports.RecordFieldsView = undefined;

var _lazyTemplate = require('../utils/lazy.template.view');

var _field = require('./field.view');

var _annotationEdit = require('../annotation/annotation.edit.view');

var RecordFieldsBaseView = _lazyTemplate.LazyTemplateView.extend({
    templateName: 'field-list',
    initialize: function initialize(options) {
        this.rows = this.collection.map(this.createRow.bind(this));
        this.listenTo(this.collection, 'add', this.insertRow);
    },
    createRow: function createRow(model) {
        var row = new _field.FieldView({ model: model });
        row.on('edit', this.edit, this);
        return row;
    },
    insertRow: function insertRow(model) {
        var row = this.createRow(model),
            rows = this.rows,
            el = row.render().el,
            index = this.collection.indexOf(model);
        if (index >= rows.length) {
            rows.push(row);
            this.$tbody.append(el);
        } else {
            rows.splice(index, 0, row);
            this.$tbody.children().eq(index).before(el);
        }
    },
    render: function render() {
        this.$el.html(this.template(this));
        this.$tbody = this.$('tbody');
        this.$tbody.append(_(this.rows).invokeMap('render').map('el').value());
        return this;
    }
});

var RecordFieldsView = exports.RecordFieldsView = RecordFieldsBaseView.extend({
    title: 'Original content',
    edit: function edit(model) {
        this.trigger('edit', model);
    }
});

var RecordAnnotationsView = exports.RecordAnnotationsView = RecordFieldsBaseView.extend({
    title: 'Annotations',
    initialize: function initialize(options) {
        RecordFieldsBaseView.prototype.initialize.call(this, options);
        this.editable = true; // enables "New field" button
    },
    events: {
        'click table + button': 'editEmpty'
    },
    edit: function edit(model) {
        var group = groupMenu.model.get('name'),
            editTarget = model.clone().set('group', group),
            preExisting = this.collection.get(editTarget),
            newRow;
        if (preExisting) {
            var index = this.collection.indexOf(preExisting),
                oldRow = this.rows[index];
            newRow = new _annotationEdit.AnnotationEditView({
                model: preExisting,
                existing: true
            });
            this.rows.splice(index, 1, newRow);
            oldRow.$el.before(newRow.render().el);
            oldRow.remove();
        } else {
            newRow = new _annotationEdit.AnnotationEditView({ model: editTarget });
            this.rows.push(newRow);
            this.$tbody.append(newRow.render().el);
        }
        newRow.on({ cancel: this.cancel, save: this.save }, this);
    },
    editEmpty: function editEmpty() {
        this.edit(new Backbone.Model());
    },
    cancel: function cancel(editRow) {
        var staticRow,
            index = _.indexOf(this.rows, editRow);
        if (editRow.existing) {
            staticRow = this.createRow(editRow.model);
            editRow.$el.after(staticRow.render().el);
        }
        editRow.remove();
        this.rows.splice(index, 1, staticRow);
    },
    save: function save(editRow) {
        var model = editRow.model;
        // first, remove the inline form
        this.rows.splice(_.indexOf(this.rows, editRow), 1);
        editRow.remove();
        // then, add the model
        if (editRow.existing) {
            // re-insert if pre-existing, because .add (below) will not trigger
            this.insertRow(model);
        }
        this.collection.add(model, { merge: true });
    }
});
},{"../annotation/annotation.edit.view":3,"../utils/lazy.template.view":22,"./field.view":8}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.GroupMenuView = exports.GroupMenuItemView = undefined;

var _lazyTemplate = require('../utils/lazy.template.view');

var GroupMenuItemView = exports.GroupMenuItemView = _lazyTemplate.LazyTemplateView.extend({
    tagName: 'li',
    templateName: 'group-menu-item',
    events: {
        'click': 'select'
    },
    render: function render() {
        this.$el.html(this.template(this.model.attributes));
        return this;
    },
    select: function select(event) {
        this.trigger('select', this.model);
    },
    activate: function activate(model) {
        if (model === this.model) {
            this.$el.addClass('active');
        } else {
            this.$el.removeClass('active');
        }
    }
});

var GroupMenuView = exports.GroupMenuView = _lazyTemplate.LazyTemplateView.extend({
    el: '#vre-group-menu',
    templateName: 'group-menu-header',
    initialize: function initialize(options) {
        this.$header = this.$('.dropdown-toggle');
        this.$list = this.$('.dropdown-menu');
        this.items = [];
        this.resetItems(this.collection);
        this.listenTo(this.collection, 'update reset', this.resetItems);
    },
    resetItems: function resetItems(collection) {
        _.invokeMap(this.items, 'remove');
        this.items = this.collection.map(_.bind(function (group) {
            var item = new GroupMenuItemView({ model: group });
            item.on('select', this.select, this);
            item.listenTo(this, 'select', item.activate);
            return item;
        }, this));
        this.$list.append(_(this.items).invokeMap('render').map('el').value());
        if (!this.model || !this.collection.includes(this.model)) {
            var savedId = localStorage.getItem('researchGroup');
            if (savedId) {
                var savedGroup = this.collection.get(savedId);
                this.select(savedGroup);
            } else {
                this.select(this.collection.first());
            }
        }
    },
    select: function select(model) {
        if (model === this.model) return;
        this.model = model;
        this.render();
        this.trigger('select', model);
        localStorage.setItem('researchGroup', model.attributes.id);
    },
    render: function render() {
        this.$header.html(this.template(this.model.attributes));
    }
});
},{"../utils/lazy.template.view":22}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ResearchGroups = undefined;

var _api = require('../utils/api.model');

var ResearchGroups = exports.ResearchGroups = _api.APICollection.extend({
    url: '/vre/api/researchgroups'
}, {
    /**
     * Class method for retrieving only the research groups of the user.
     */
    mine: function mine() {
        var myResearchGroups = new ResearchGroups();
        myResearchGroups.fetch({ url: myResearchGroups.url + '/mine' });
        return myResearchGroups;
    }
});
},{"../utils/api.model":20}],12:[function(require,module,exports){
(function (global){
'use strict';

var _backbone = (typeof window !== "undefined" ? window['_backbone'] : typeof global !== "undefined" ? global['_backbone'] : null);

var _handlebars = (typeof window !== "undefined" ? window['_handlebars'] : typeof global !== "undefined" ? global['_handlebars'] : null);

var _lodash = (typeof window !== "undefined" ? window['_lodash'] : typeof global !== "undefined" ? global['_lodash'] : null);

var _jquery = (typeof window !== "undefined" ? window['_jquery'] : typeof global !== "undefined" ? global['_jquery'] : null);

var _record = require('./record/record.model');

var _recordList = require('./record/record.list.view');

var _recordDetail = require('./record/record.detail.view');

var _collection = require('./collection/collection.model');

var _group = require('./group/group.model');

var _groupMenu = require('./group/group.menu.view');

var _search = require('./search/search.model');

var _search2 = require('./search/search.view');

var _selectSource = require('./select-source/select-source.view');

var _genericFunctions = require('./utils/generic-functions');

var VRERouter = _backbone.Backbone.Router.extend({
    routes: {
        ':id/': 'showDatabase'
    },
    showDatabase: function showDatabase(id) {
        searchView.render();
        searchView.$el.appendTo((0, _jquery.$)('.page-header').first());
        // The if-condition is a bit of a hack, which can go away when we
        // convert to client side routing entirely.
        if (id == "hpb") {
            (0, _jquery.$)('#HPB-info').show();
            var advancedSearchView = new _search2.AdvancedSearchView();
            advancedSearchView.render();
            searchView.listenTo(advancedSearchView, 'fill', searchView.fill);
            (0, _jquery.$)('#search-info').show();
            (0, _jquery.$)('#search-info').popover({
                'html': true,
                'content': JST['hpb-search-info'](),
                'container': 'body',
                'placement': 'left'
            });
        } else {
            // We are not on the HPB search page, so display the
            // records in the current collection.
            (0, _jquery.$)('#HPB-info').hide();
            currentVRECollection = myCollections.get(id);
            records = currentVRECollection.getRecords();
            recordsList.remove();
            recordsList = new _recordList.RecordListView({ collection: records });
            recordsList.render().$el.insertAfter((0, _jquery.$)('.page-header'));
        }
        searchView.source = id;
    }
});

// Global object to hold the templates, initialized at page load below.
var JST = {};
var currentVRECollection;
var records = new _record.Records();
var allCollections = new _collection.VRECollections();
var myCollections = _collection.VRECollections.mine();
var allGroups = new _group.ResearchGroups();
var myGroups, groupMenu;
var recordDetailModal;
var dropDown;
var recordsList = new _recordList.RecordListView({ collection: records });
var results = new _search.SearchResults();
var searchView = new _search2.SearchView();
var router = new VRERouter();

// Override Backbone.sync so it always includes the CSRF token in requests.
(function () {
    var id = _lodash._.identity;
    _backbone.Backbone.sync = _lodash._.overArgs(_backbone.Backbone.sync, [id, id, _genericFunctions.addCSRFToken]);
})();

function prepareCollectionViews() {
    recordDetailModal = new _recordDetail.RecordDetailView();
    dropDown = new _selectSource.SelectSourceView({ collection: myCollections });
    dropDown.$el.appendTo((0, _jquery.$)('.nav').first());
}

(0, _jquery.$)(function () {
    (0, _jquery.$)('script[type="text/x-handlebars-template"]').each(function (i, element) {
        $el = (0, _jquery.$)(element);
        JST[$el.prop('id')] = _handlebars.Handlebars.compile($el.html(), { compat: true });
    });
    (0, _jquery.$)('#result_detail').modal({ show: false });
    // We fetch the collections and ensure that we have them before we handle
    // the route, because VRERouter.showCollection depends on them being
    // available. This is something we can definitely improve upon.
    allCollections.fetch().then(function () {
        _backbone.Backbone.history.start({
            pushState: true, // this enables matching the path of the URL hashchange
            root: '/vre/'
        });
    });
    allGroups.fetch();
    myGroups = _group.ResearchGroups.mine();
    groupMenu = new _groupMenu.GroupMenuView({ collection: myGroups });
    if (myCollections.length) {
        prepareCollectionViews();
    } else {
        myCollections.on("sync", prepareCollectionViews);
    }
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./collection/collection.model":5,"./group/group.menu.view":10,"./group/group.model":11,"./record/record.detail.view":13,"./record/record.list.view":15,"./record/record.model":16,"./search/search.model":17,"./search/search.view":18,"./select-source/select-source.view":19,"./utils/generic-functions":21}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.RecordDetailView = undefined;

var _lazyTemplate = require('../utils/lazy.template.view');

var _annotation = require('../annotation/annotation.model');

var _recordField = require('../field/record.field.view');

var _field = require('../field/field.model');

var _collection = require('../collection/collection.view');

var RecordDetailView = exports.RecordDetailView = _lazyTemplate.LazyTemplateView.extend({
    el: '#result_detail',
    templateName: 'item-fields',
    events: {
        'click #load_next': 'load',
        'click #load_previous': 'load'
    },
    initialize: function initialize(options) {
        this.$title = this.$('.modal-title');
        this.$body = this.$('.modal-body');
        this.$footer = this.$('.modal-footer');
        this.vreCollectionsSelect = new _collection.VRECollectionView({ collection: myCollections });
    },
    setModel: function setModel(model) {
        if (this.model) {
            if (this.model === model) return this;
            this.annotationsView.remove().off();
            this.fieldsView.remove().off();
        }
        this.model = model;
        this.fieldsView = new _recordField.RecordFieldsView({
            collection: new _field.FlatFields(null, { record: model })
        });
        this.annotationsView = new _recordField.RecordAnnotationsView({
            collection: new _annotation.FlatAnnotations(null, { record: model })
        });
        this.vreCollectionsSelect.clear().setRecord(model);
        this.annotationsView.listenTo(this.fieldsView, 'edit', this.annotationsView.edit);
        var uriText = this.model.get('uri');
        this.$title.text(uriText);
        document.getElementById("uri-link").href = uriText;
        this.fieldsView.render().$el.appendTo(this.$body);
        this.annotationsView.render().$el.appendTo(this.$body);
        return this;
    },
    render: function render() {
        this.$footer.prepend(this.vreCollectionsSelect.render().$el);
        this.$el.modal('show');
        return this;
    },
    load: function load(event) {
        var currentIndex = recordsList.collection.findIndex(this.model);
        var nextIndex = event.target.id === 'load_next' ? currentIndex + 1 : currentIndex - 1;
        var nextModel = recordsList.collection.at(nextIndex);
        this.setModel(nextModel);
        this.render();
    }
});
},{"../annotation/annotation.model":4,"../collection/collection.view":6,"../field/field.model":7,"../field/record.field.view":9,"../utils/lazy.template.view":22}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.RecordListItemView = exports.SelectAllView = exports.SelectableView = undefined;

var _lazyTemplate = require('../utils/lazy.template.view');

/**
 * Common base for views that provide behaviour revolving around a
 * single checkbox. When deriving a subclass, bind the `toggle`
 * method to the right checkbox and set `this.$checkbox` in the
 * `render` method.
 */
var SelectableView = exports.SelectableView = _lazyTemplate.LazyTemplateView.extend({
    toggle: function toggle(event) {
        // The assignment in the if condition is on purpose (assign + check).
        if (this.selected = event.target.checked) {
            this.trigger('check');
        } else {
            this.trigger('uncheck');
        }
    },
    check: function check() {
        this.$checkbox.prop('checked', true);
        this.selected = true;
        return this;
    },
    uncheck: function uncheck() {
        this.$checkbox.prop('checked', false);
        this.selected = false;
        return this;
    }
});

var SelectAllView = exports.SelectAllView = SelectableView.extend({
    className: 'checkbox',
    templateName: 'select-all-view',
    events: {
        'change input': 'toggle'
    },
    render: function render() {
        this.$el.html(this.template({}));
        this.$checkbox = this.$('input');
        return this;
    }
});

var RecordListItemView = exports.RecordListItemView = SelectableView.extend({
    tagName: 'tr',
    templateName: 'record-list-item',
    events: {
        'change input': 'toggle',
        'click a': 'display'
    },
    render: function render() {
        this.$el.html(this.template(this.model.attributes));
        this.$checkbox = this.$('input');
        return this;
    },
    display: function display(event) {
        recordDetailModal.setModel(this.model).render();
    }
});
},{"../utils/lazy.template.view":22}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.RecordListView = undefined;

var _lazyTemplate = require('../utils/lazy.template.view');

var _collection = require('../collection/collection.view');

var _recordListItem = require('./record.list.item.view');

var RecordListView = exports.RecordListView = _lazyTemplate.LazyTemplateView.extend({
    tagName: 'form',
    templateName: 'record-list',
    events: {
        'submit': function submit(event) {
            this.vreCollectionsSelect.submitForm(event);
        },
        'click #more-records': 'loadMore'
    },
    initialize: function initialize(options) {
        this.items = [];
        this.checkedCount = 0;
        this.listenTo(this.collection, {
            add: this.addItem,
            reset: this.render,
            complete: this.showSelectAll
        });
        this.vreCollectionsSelect = new _collection.VRECollectionView({ collection: myCollections });
    },
    render: function render() {
        this.$el.html(this.template({}));
        this.$tbody = this.$('tbody');
        this.renderItems();
        $('#HPB-info').hide();
        this.vreCollectionsSelect.render();
        this.$el.prepend(this.vreCollectionsSelect.$el);
        return this;
    },
    renderItems: function renderItems() {
        this.$tbody.empty();
        this.collection.forEach(this.addItem.bind(this));
        return this;
    },
    addItem: function addItem(model, collection, options) {
        var item = new _recordListItem.RecordListItemView({ model: model });
        item.on({ check: this.checkOne, uncheck: this.uncheckOne }, this);
        var index;
        if (options && (index = options.index) != null && index !== this.items.length) {
            // Insert at the front or in the middle.
            this.items.splice(index, 0, item);
            this.$('tr').eq(index).before(item.render().el);
        } else {
            // Append at the back.
            this.items.push(item);
            this.$tbody.append(item.render().el);
        }
        return this;
    },
    loadMore: function loadMore(event) {
        searchView.nextSearch(event);
    },
    showSelectAll: function showSelectAll() {
        var selectAllView = this.selectAllView = new _recordListItem.SelectAllView();
        this.$('table').before(selectAllView.render().el);
        selectAllView.on({
            check: this.checkAll,
            uncheck: this.uncheckAll
        }, this).listenTo(this, {
            allChecked: selectAllView.check,
            notAllChecked: selectAllView.uncheck
        });
    },
    checkOne: function checkOne() {
        if (++this.checkedCount === this.collection.length) {
            this.trigger('allChecked');
        }
        return this;
    },
    uncheckOne: function uncheckOne() {
        --this.checkedCount;
        this.trigger('notAllChecked');
        return this;
    },
    checkAll: function checkAll() {
        this.checkedCount = this.collection.length;
        _.invokeMap(this.items, 'check');
        return this;
    },
    uncheckAll: function uncheckAll() {
        this.checkedCount = 0;
        _.invokeMap(this.items, 'uncheck');
        return this;
    }
});
},{"../collection/collection.view":6,"../utils/lazy.template.view":22,"./record.list.item.view":14}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Records = exports.Record = undefined;

var _api = require('../utils/api.model');

var _annotation = require('../annotation/annotation.model');

var Record = exports.Record = _api.APIModel.extend({
    urlRoot: '/vre/api/records',
    getAnnotations: function getAnnotations() {
        if (!this.annotations) {
            this.annotations = new _annotation.Annotations();
            if (!this.isNew()) this.annotations.query({
                params: { record__id: this.id }
            });
        }
        return this.annotations;
    }
});

var Records = exports.Records = _api.APICollection.extend({
    url: '/vre/api/records',
    model: Record
});
},{"../annotation/annotation.model":4,"../utils/api.model":20}],17:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SearchResults = undefined;

var _record = require('../record/record.model');

var SearchResults = exports.SearchResults = _record.Records.extend({
    url: '/vre/api/search',
    total_results: 0,
    parse: function parse(response) {
        this.total_results = response.total_results;
        return response.result_list;
    }
});
},{"../record/record.model":16}],18:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.AdvancedSearchView = exports.SearchView = undefined;

var _lazyTemplate = require('../utils/lazy.template.view');

var _alert = require('../alert/alert.view');

var SearchView = exports.SearchView = _lazyTemplate.LazyTemplateView.extend({
    templateName: "search-view",
    events: {
        'submit': 'firstSearch'
    },
    render: function render() {
        this.$el.html(this.template());
        return this;
    },
    showPending: function showPending() {
        this.$('button').first().text('Searching...');
        return this;
    },
    showIdle: function showIdle() {
        this.$('button').first().text('Search');
        return this;
    },
    submitSearch: function submitSearch(startRecord) {
        this.showPending();
        var myElement = this.el;
        var searchTerm = this.$('input').val();
        var searchPromise = results.query({ params: { search: searchTerm, source: this.source, startRecord: startRecord },
            error: function error(collection, response, options) {
                var alert = new _alert.AlertView({
                    level: 'warning',
                    message: JST['failed-search-message'](response)
                });
                alert.render().$el.insertAfter('.page-header');
                alert.animateIn();
            }
        });
        searchPromise.always(this.showIdle.bind(this));
        return searchPromise;
    },
    firstSearch: function firstSearch(event) {
        event.preventDefault();
        this.submitSearch(1).then(_.bind(function () {
            $('#more-records').show();
            records.reset(results.models);
            if (!document.contains(recordsList.$el[0])) {
                // records list is initialized and rendered but not yet added to DOM
                recordsList.$el.insertAfter($('.page-header'));
            }
            this.feedback();
        }, this));
    },
    nextSearch: function nextSearch(event) {
        event.preventDefault();
        $('#more-records').hide();
        var startRecord = records.length + 1;
        this.submitSearch(startRecord).then(_.bind(function () {
            records.add(results.models);
            this.feedback();
        }, this));
    },
    feedback: function feedback() {
        if (records.length === results.total_results) {
            records.trigger('complete');
        } else {
            $('#more-records').show();
        }
        $('#search-feedback').text("Showing " + records.length + " of " + results.total_results + " results");
    },
    fill: function fill(fillText) {
        this.$('#query-input').val(fillText);
    }
});

var AdvancedSearchView = exports.AdvancedSearchView = _lazyTemplate.LazyTemplateView.extend({
    templateName: 'hpb-search-info',
    events: {
        'click a': 'fill'
    },
    render: function render() {
        $('#search-info').show();
        $('#search-info').popover({
            'html': true,
            'content': this.$el.html(this.template()),
            'container': 'body',
            'placement': 'left'
        });
    },
    fill: function fill(event) {
        event.preventDefault();
        fillIn = event.target.textContent.slice(0, -9);
        this.trigger('fill', fillIn);
    }
});
},{"../alert/alert.view":2,"../utils/lazy.template.view":22}],19:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SelectSourceView = undefined;

var _lazyTemplate = require('../utils/lazy.template.view');

var SelectSourceView = exports.SelectSourceView = _lazyTemplate.LazyTemplateView.extend({
    templateName: 'nav-dropdown',
    tagName: 'li',
    className: 'dropdown',
    initialize: function initialize() {
        this.render();
    },
    render: function render() {
        var collections = { 'collections': this.collection.toJSON() };
        this.$el.html(this.template(collections));
    }
});
},{"../utils/lazy.template.view":22}],20:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.APICollection = exports.APIModel = undefined;

var _backbone = (typeof window !== "undefined" ? window['_backbone'] : typeof global !== "undefined" ? global['_backbone'] : null);

/**
 * Generic subclass that appends a slash to the model URL.
 * This is required for interop with Django REST Framework.
 */
var APIModel = exports.APIModel = _backbone.Backbone.Model.extend({
    url: function url() {
        return _backbone.Backbone.Model.prototype.url.call(this) + '/';
    }
});

/**
 * Generic subclass that supports filtering at the backend.
 */
var APICollection = exports.APICollection = _backbone.Backbone.Collection.extend({
    model: APIModel,
    query: function query(options) {
        var url = options.url || this.url;
        var urlParts = [url, '?'];
        if (options.params) {
            urlParts.push(objectAsUrlParams(options.params));
        }
        var fetchOptions = _(options).omit(['params']).extend({
            url: urlParts.join('')
        }).value();
        return this.fetch(fetchOptions);
    }
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],21:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.objectAsUrlParams = objectAsUrlParams;
exports.addCSRFToken = addCSRFToken;
exports.canonicalSort = canonicalSort;
/**
 * Perform the following transformation:
 * (from)  {foo: 'bar', foobar: 'baz'}
 * (to)    'foo=bar&foobar=baz'
 */
function objectAsUrlParams(object) {
    return _(object).entries().invokeMap('join', '=').join('&');
}

function addCSRFToken(ajaxOptions) {
    return _.defaultsDeep({
        headers: { 'X-CSRFToken': Cookies.get('csrftoken') }
    }, ajaxOptions);
}

function canonicalSort(key) {
    var index = canonicalOrder[key] || 100;
    return index;
}

var canonicalOrder = {
    'Title': 1,
    'Uniform Title': 4,
    'Varying Form of Title': 5,
    'Author': 8,
    'Collaborator': 12,
    'Production': 16,
    'Publisher': 20,
    'Added Entry - Corporate Name': 24,
    'Extent': 28,
    'Language': 32,
    'Citation/Reference': 36,
    'Location of Originals': 40,
    'Note': 44,
    'With Note': 48,
    'Subject Headings': 52
};
},{}],22:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.LazyTemplateView = undefined;

var _backbone = (typeof window !== "undefined" ? window['_backbone'] : typeof global !== "undefined" ? global['_backbone'] : null);

var _backbone2 = _interopRequireDefault(_backbone);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Intermediate class to enable lazy loading of templates.
 * `JST` is uninitialized at the time of extension, so postpone fetching
 * the template until it's needed.
 */
var LazyTemplateView = exports.LazyTemplateView = _backbone2.default.View.extend({
    template: function template(context) {
        this.template = JST[this.templateName];
        return this.template(context);
    }
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[12]);
