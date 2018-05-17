
function isChecked(index, item) {
    return item.checked;
}

function getContent(index, item) {
    return $(item).data('content');
}

function getValue(index, item) {
    return $(item).data('value');
}

/**
 * Insert the CSRF token header into $.ajax-compatible request options.
 * Returns a new object, does not mutate the original object.
 */
function addCSRFToken(ajaxOptions) {
    return _.defaultsDeep({
        headers: {'X-CSRFToken': Cookies.get('csrftoken')},
    }, ajaxOptions);
}

// Override Backbone.sync so it always includes the CSRF token in requests.
(function() {
    var id = _.identity;
    Backbone.sync = _.overArgs(Backbone.sync, [id, id, addCSRFToken]);
}());

function retrieveMoreRecords(event) {
    event.preventDefault();
    searchView.nextSearch(event);
}

function show_detail(event) {
    event.preventDefault();
    var sisterCheckbox = $(this).parents('tr').find('input');
    var jsonData = sisterCheckbox.data('content');
    renderRecordDetail(jsonData);
}

/**
 * Perform the following transformation:
 * (from)  {foo: 'bar', foobar: 'baz'}
 * (to)    'foo=bar&foobar=baz'
 */
function objectAsUrlParams(object) {
    return _(object).entries().invokeMap('join', '=').join('&');
}

/**
 * Generic subclass that appends a slash to the model URL.
 * This is required for interop with Django REST Framework.
 */
var APIModel = Backbone.Model.extend({
    url: function() {
        return Backbone.Model.prototype.url.call(this) + '/';
    },
});

/**
 * Generic subclass that supports filtering at the backend.
 */
var APICollection = Backbone.Collection.extend({
    model: APIModel,
    query: function(options) {
        var url = options.url || this.url;
        var urlParts = [url, '?'];
        if (options.params) {
            urlParts.push(objectAsUrlParams(options.params));
        }
        var fetchOptions = _(options).omit(['params']).extend({
            url: urlParts.join(''),
        }).value();
        return this.fetch(fetchOptions);
    },
});

// A single field of a single record.
var Field = Backbone.Model.extend({
    idAttribute: 'key',
});

/**
 * This is an alternative, flat representation of the fields in a given
 * option.record. Its purpose is to be easier to represent and manage from
 * a view.
 *
 * normal: {id, uri, content}
 * flat alternative: [{id, key, value}]
 *
 * Note that we extend directly from Backbone.Collection rather than from
 * APICollection and that we don't set a URL. This is because we only talk
 * to the server through the underlying Record model.
 */
var FlatFields = Backbone.Collection.extend({
    model: Field,
    initialize: function(models, options) {
        _.assign(this, _.pick(options, ['record']));
        if (this.record.has('content')) this.set(this.toFlat(this.record));
        // Do the above line again when the record changes.
        this.listenTo(this.record, 'change', _.flow([this.toFlat, this.set]));
    },
    toFlat: function(record) {
        return _.map(record.get('content'), function(value, key) {
            return {key: key, value: value};
        });
    },
});

var Annotations = APICollection.extend({
    url: '/vre/api/annotations',
});

/**
 * This is an alternative, flat representation of the annotations for a
 * given option.record, similar to FlatFields. It proxies to a normal
 * Annotations (see above), using event bindings to keep the two
 * representations in sync. This requires some additional sophistication
 * compared to FlatFields, because annotations allow editing and because
 * there may be multiple underlying annotation objects.
 *
 * normal: {id, record, managing_group, content}
 * flat alternative: [{id, key, value, group}]
 */
var FlatAnnotations = Backbone.Collection.extend({
    // comparator: can be set to keep this sorted
    // How to uniquely identify a field annotation.
    modelId: function(attributes) {
        return attributes.key + ':' + attributes.group;
    },
    initialize: function(models, options) {
        _.assign(this, _.pick(options, ['record']));
        this.underlying = this.record.getAnnotations();
        this.underlying.forEach(this.toFlat.bind(this));
        this.markedGroups = new Backbone.Collection([]);
        this.listenTo(this.underlying, 'add change:content', this.toFlat);
        this.on('add change:value', this.markGroup);
        this.markedGroups.on('add', _.debounce(this.fromFlat), this);
        // this.listenTo(this.underlying, 'remove', TODO);
        // this.on('remove', TODO);
    },
    // translate the official representation to the flat one
    toFlat: function(annotation) {
        if (annotation.isNew() || annotation.hasChanged()) {
            // Store the annotation either immediately or on record save.
            if (this.record.isNew()) {
                this.listenToOnce(annotation, 'change:record', function() {
                    annotation.save(null, {silent: true});
                });
            } else annotation.save(null, {silent: true});
        }
        var id = annotation.id,
            groupId = annotation.get('managing_group'),
            groupName = allGroups.get(groupId).get('name'),
            content = annotation.get('content'),
            existing = _.map(this.filter({group: groupName}), 'attributes'),
            replacements = _.map(content, function(value, key) {
                return {id: id, key: key, value: value, group: groupName};
            }),
            obsolete = _.differenceBy(existing, replacements, this.modelId);
        // After the next two lines, this.models will be up-to-date and
        // appropriate events will have been triggered.
        this.remove(obsolete);
        this.add(replacements, {merge: true});
    },
    markGroup: function(flatAnnotation) {
        this.markedGroups.add({id: flatAnnotation.get('group')});
    },
    // translate the flat representation to the official one, save immediately
    fromFlat: function() {
        var flat = this,
            record = flat.record,
            recordId = record.id,
            flatPerGroup = flat.groupBy('group');
        var newContent = flat.markedGroups.map('id').map(function(groupName) {
            var groupId = allGroups.findWhere({name: groupName}).id,
                existing = flat.underlying.findWhere({managing_group: groupId}),
                id = existing && existing.id,
                content = _(flatPerGroup[groupName]).map(function(model) {
                    return [model.get('key'), model.get('value')];
                }).fromPairs().value();
            return {
                id: id,
                record: recordId,
                managing_group: groupId,
                content: content,
            };
        });
        // At least one annotation exists, so now is the time to ensure
        // the VRE knows the record.
        if (record.isNew()) record.save().then(function() {
            _.invokeMap(flat.underlying.models, 'set', 'record', record.id);
        });
        flat.underlying.add(newContent, {merge: true});
        flat.markedGroups.reset();
    },
});

var Record = APIModel.extend({
    urlRoot: '/vre/api/records',
    getAnnotations: function() {
        if (!this.annotations) {
            this.annotations = new Annotations();
            if (!this.isNew()) this.annotations.query({
                params: {record__id: this.id}
            });
        }
        return this.annotations;
    },
});

var AdditionsToCollections = Backbone.Model.extend({
    url: '/vre/add-selection',
});

var Records = APICollection.extend({
    url: '/vre/api/records',
    model: Record,
});

var SearchResults = Records.extend({
    url:'/vre/api/search',
    total_results: 0,
    parse: function(response) {
        this.total_results = response.total_results;
        /*
        var displayString = "Showing ".concat(this.length, " of ", this.total_results, " results");
        $("h4").html(displayString);*/
        return response.result_list;
    }
});

/**
 * Representation of a single VRE collection.
 */
var VRECollection = Backbone.Model.extend({
    getRecords: function() {
        if (!this.records) {
            this.records = new Records();
            this.records.query({params: {collection__id: this.id}});
        }
        return this.records;
    },
});

var VRECollections = APICollection.extend({
    url: '/vre/api/collections',
    model: VRECollection,
}, {
    /**
     * Class method for retrieving only the collections the user can manage.
     */
    mine: function() {
        var myCollections = new VRECollections();
        myCollections.fetch({url: myCollections.url + '/mine'});
        return myCollections;
    },
});

var ResearchGroups = APICollection.extend({
    url: '/vre/api/researchgroups',
}, {
    /**
     * Class method for retrieving only the research groups of the user.
     */
    mine: function() {
        var myResearchGroups = new ResearchGroups();
        myResearchGroups.fetch({url: myResearchGroups.url + '/mine'});
        return myResearchGroups;
    },
});

/**
 * Intermediate class to enable lazy loading of templates.
 * `JST` is uninitialized at the time of extension, so postpone fetching
 * the template until it's needed.
 */
var LazyTemplateView = Backbone.View.extend({
    template: function(context) {
        this.template = JST[this.templateName];
        return this.template(context);
    },
});

var RecordListItemView = LazyTemplateView.extend({
    tagName: 'tr',
    templateName: 'record-list-item',
    events: {
        'change input': 'toggle',
        'click a': 'display',
    },
    render: function() {
        this.$el.html(this.template(this.model.attributes));
        return this;
    },
    toggle: function(event) {
        this.selected = event.target.checked;
    },
    display: function(event) {
        recordDetailModal.setModel(this.model).render();
    },
});

var VRECollectionView = LazyTemplateView.extend({
    templateName: 'collection-selector',
    events: {
        'click button': 'submitForm',
    },
    render: function() {
        this.$el.html(this.template({models: this.collection.toJSON()}));
        this.$('select').select2();
        return this;
    },
    setRecord: function(model) {
        this.model = model;
        return this;
    },
    clear: function() {
        this.$el.val(null).trigger('change');
    },
    submitForm: function(event) {
        event.preventDefault();
        var selected_records = [];
        if (this.model) {
            // adding to array as the api expects an array.
            selected_records.push(this.model.toJSON());
            this.model = undefined;
        }
        else {
            selected_records = _(recordsList.items).filter({selected: true}).invokeMap('model.toJSON').value();
        }
        var selected_collections = this.$('select').val();
        var records_and_collections = new AdditionsToCollections({
            'records': selected_records,
            'collections': selected_collections,
        });
        records_and_collections.save();
    },
});

var SearchView= LazyTemplateView.extend({
    templateName: "search-view",
    events: {
        'submit': 'firstSearch',
    },
    render: function() {
        this.$el.html(this.template());
    },
    submitSearch: function(startRecord) {
        var searchTerm = this.$('input').val();
        var startFrom = startRecord ? startRecord : 1;
        var hold = results.query({params:{search:searchTerm, source:this.source, startRecord:startFrom}});
        return hold;
    },
    firstSearch: function(event){
        event.preventDefault();
        this.submitSearch().then( function() {
            $('#more-records').show();
            records.reset(results.models);
            recordsList.render().$el.insertAfter($('#title-HPB'));
        });
    },
    nextSearch: function(event) {
        $('#more-records').hide();
        var startRecord = records.length;
        this.submitSearch(startRecord).then( function() {
            records.add(results.models);
            if (records.length!=results.total_results) {
                $('#more-records').show();
            }
        });
    },
});


var RecordListView = LazyTemplateView.extend({
    tagName: 'form',
    templateName: 'record-list',
    events: {
        'submit': function(event) {
            this.vreCollectionsSelect.submitForm(event);
        },
    },
    initialize: function(options) {
        this.items = [];
        this.listenTo(this.collection, {
            add: this.addItem,
            reset: this.render,
        });
        this.vreCollectionsSelect = new VRECollectionView({collection: myCollections});
    },
    render: function() {
        this.$el.html(this.template({}));
        this.$tbody = this.$('tbody');
        this.renderItems();
        $('#HPB-info').hide();
        this.vreCollectionsSelect.render();
        this.$el.prepend(this.vreCollectionsSelect.$el);
        return this;
    },
    renderItems: function() {
        this.$tbody.empty();
        this.collection.forEach(this.addItem.bind(this));
        return this;
    },
    addItem: function(model, collection, options) {
        var item = new RecordListItemView({model: model});
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
});

/**
 * Displays a single model from a FlatFields or FlatAnnotations collection.
 */
var FieldView = LazyTemplateView.extend({
    tagName: 'tr',
    templateName: 'field-list-item',
    events: {
        'click': 'edit',
    },
    initialize: function(options) {
        this.listenTo(this.model, 'change:value', this.render);
    },
    render: function() {
        this.$el.html(this.template(this.model.attributes));
        return this;
    },
    edit: function(event) {
        this.trigger('edit', this.model);
    },
});

var AnnotationEditView = LazyTemplateView.extend({
    tagName: 'tr',
    className: 'form-inline',
    templateName: 'field-list-item-edit',
    events: {
        'submit': 'submit',
        'reset': 'reset',
    },
    initialize: function(options) {
        _.assign(this, _.pick(options, ['existing']));
    },
    render: function() {
        this.$el.html(this.template(
            _.extend({cid: this.cid}, this.model.attributes)
        ));
        return this;
    },
    submit: function(event) {
        event.preventDefault();
        var model = this.model;
        this.$('input').each(function(index, element) {
            model.set(this.name, $(this).val());
        });
        this.trigger('save', this);
    },
    reset: function(event) {
        event.preventDefault();
        this.trigger('cancel', this);
    },
});

var RecordFieldsBaseView = LazyTemplateView.extend({
    templateName: 'field-list',
    initialize: function(options) {
        this.rows = this.collection.map(this.createRow.bind(this));
        this.listenTo(this.collection, 'add', this.insertRow);
    },
    createRow: function(model) {
        var row = new FieldView({model: model});
        row.on('edit', this.edit, this);
        return row;
    },
    insertRow: function(model) {
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
    render: function() {
        this.$el.html(this.template(this));
        this.$tbody = this.$('tbody');
        this.$tbody.append(_(this.rows).invokeMap('render').map('el').value());
        return this;
    },
});

var RecordFieldsView = RecordFieldsBaseView.extend({
    title: 'Original content',
    edit: function(model) {
        this.trigger('edit', model);
    },
});

var RecordAnnotationsView = RecordFieldsBaseView.extend({
    title: 'Annotations',
    initialize: function(options) {
        RecordFieldsBaseView.prototype.initialize.call(this, options);
        this.editable = true;  // enables "New field" button
    },
    events: {
        'click table + button': 'editEmpty',
    },
    edit: function(model) {
        var group = groupMenu.model.get('name'),
            editTarget = model.clone().set('group', group),
            preExisting = this.collection.get(editTarget),
            newRow;
        if (preExisting) {
            var index = this.collection.indexOf(preExisting),
                oldRow = this.rows[index];
            newRow = new AnnotationEditView({
                model: preExisting,
                existing: true,
            });
            this.rows.splice(index, 1, newRow);
            oldRow.$el.before(newRow.render().el);
            oldRow.remove();
        } else {
            newRow = new AnnotationEditView({model: editTarget});
            this.rows.push(newRow);
            this.$tbody.append(newRow.render().el);
        }
        newRow.on({cancel: this.cancel, save: this.save}, this);
    },
    editEmpty: function() {
        this.edit(new Backbone.Model());
    },
    cancel: function(editRow) {
        var staticRow, index = _.indexOf(this.rows, editRow);
        if (editRow.existing) {
            staticRow = this.createRow(editRow.model);
            editRow.$el.after(staticRow.render().el);
        }
        editRow.remove();
        this.rows.splice(index, 1, staticRow);
    },
    save: function(editRow) {
        var model = editRow.model;
        // first, remove the inline form
        this.rows.splice(_.indexOf(this.rows, editRow), 1);
        editRow.remove();
        // then, add the model
        if (editRow.existing) {
            // re-insert if pre-existing, because .add (below) will not trigger
            this.insertRow(model);
        }
        this.collection.add(model, {merge: true});
    },
});

var SelectSourceView = LazyTemplateView.extend({
    templateName: 'nav-dropdown',
    tagName: 'li',
    className: 'dropdown',
    initialize: function() {
        this.render();
    },
    render: function() {
        var collections = {'collections': this.collection.toJSON()};
        this.$el.html(this.template(collections));
    },
});

var RecordDetailView = LazyTemplateView.extend({
    el: '#result_detail',
    templateName: 'item-fields',
    events: {
        'click #load_next': 'load',
        'click #load_previous': 'load',
    },
    initialize: function(options) {
        this.$title = this.$('.modal-title');
        this.$body = this.$('.modal-body');
        this.$footer = this.$('.modal-footer');
        this.vreCollectionsSelect = new VRECollectionView({collection: myCollections});
        this.$footer.prepend(this.vreCollectionsSelect.render().$el);
    },
    setModel: function(model) {
        if (this.model) {
            if (this.model === model) return this;
            this.annotationsView.remove().off();
            this.fieldsView.remove().off();
        }
        this.model = model;
        this.fieldsView = new RecordFieldsView({
            collection: new FlatFields(null, {record: model}),
        });
        this.annotationsView = new RecordAnnotationsView({
            collection: new FlatAnnotations(null, {record: model}),
        });
        this.vreCollectionsSelect.setRecord(model);
        this.annotationsView.listenTo(this.fieldsView, 'edit', this.annotationsView.edit);
        return this;
    },
    render: function() {
        this.$title.text(this.model.get('uri'));
        this.$el.modal('show');
        this.fieldsView.render().$el.appendTo(this.$body);
        this.annotationsView.render().$el.appendTo(this.$body);
        return this;
    },
    load: function(event) {
        var currentIndex = recordsList.collection.findIndex(this.model);
        var nextIndex = event.target.id==='load_next'? currentIndex+1 : currentIndex-1;
        var nextModel = recordsList.collection.at(nextIndex);
        this.setModel(nextModel);
        this.render();
    },
});

var GroupMenuItemView = LazyTemplateView.extend({
    tagName: 'li',
    templateName: 'group-menu-item',
    events: {
        'click': 'select',
    },
    render: function() {
        this.$el.html(this.template(this.model.attributes));
        return this;
    },
    select: function(event) {
        this.trigger('select', this.model);
    },
    activate: function(model) {
        if (model === this.model) {
            this.$el.addClass('active');
        } else {
            this.$el.removeClass('active');
        }
    },
});

var GroupMenuView = LazyTemplateView.extend({
    el: '#vre-group-menu',
    templateName: 'group-menu-header',
    initialize: function(options) {
        this.$header = this.$('.dropdown-toggle');
        this.$list = this.$('.dropdown-menu');
        this.items = [];
        this.resetItems(this.collection);
        this.listenTo(this.collection, 'update reset', this.resetItems);
    },
    resetItems: function(collection) {
        _.invokeMap(this.items, 'remove');
        this.items = this.collection.map(_.bind(function(group) {
            var item = new GroupMenuItemView({model: group});
            item.on('select', this.select, this);
            item.listenTo(this, 'select', item.activate);
            return item;
        }, this));
        this.$list.append(_(this.items).invokeMap('render').map('el').value());
        if (!this.model || !this.collection.includes(this.model)) {
            this.select(this.collection.first());
        }
    },
    select: function(model) {
        if (model === this.model) return;
        this.model = model;
        this.render();
        this.trigger('select', model);
    },
    render: function() {
        this.$header.html(this.template(this.model.attributes));
    },
});

var VRERouter = Backbone.Router.extend({
    routes: {
        ':id/': 'showDatabase',
    },
    showDatabase: function(id) {
        searchView.render();
        searchView.$el.appendTo($('.collapse').first());
        // The if-condition is a bit of a hack, which can go away when we
        // convert to client side routing entirely.
        if (id=="hpb") {
            recordsList.remove();
            records = new Records();
            recordsList = new RecordListView({collection: records});
            $('#HPB-info').show();
        }
        else {
            // We are not on the HPB search page, so display the
            // records in the current collection.
            $('#HPB-info').hide();
            var collection = allCollections.get(id);
            records = collection.getRecords();
            recordsList.remove();
            recordsList = new RecordListView({collection: records});
            recordsList.render().$el.insertAfter($('#title-collection'));
        }
        searchView.source = id;
    },
});

// Global object to hold the templates, initialized at page load below.
var JST = {};
var records = new Records();
var allCollections = new VRECollections();
var myCollections = VRECollections.mine();
var allGroups = new ResearchGroups();
var myGroups, groupMenu;
var recordDetailModal;
var dropDown;
var recordsList = new RecordListView({collection: records});
var results = new SearchResults();
var searchView  = new SearchView();
var router = new VRERouter();
//var moreResults = new LoadMoreResultsView();

function prepareCollectionViews() {
    recordDetailModal = new RecordDetailView();
    dropDown = new SelectSourceView({collection:myCollections});
    dropDown.$el.prependTo($('.nav').first());
}

$(function() {
    $('script[type="text/x-handlebars-template"]').each(function(i, element) {
        $el = $(element);
        JST[$el.prop('id')] = Handlebars.compile($el.html(), {compat: true});
    });
    $('#result_detail').modal({show: false});
    $('#more-records').click(retrieveMoreRecords);
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
