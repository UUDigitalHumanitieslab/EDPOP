function isChecked(index, item) {
    return item.checked;
}

function getContent(index, item) {
    return $(item).data('content');
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

function return_selected_records(event) {
    event.preventDefault();
    var selected = $(this).find("input").filter(isChecked).map(getContent).get();
    $.ajax(addCSRFToken({
        url: 'add-selection',
        contentType:'application/json',
        data: JSON.stringify(selected),
        success : function(json) {
            console.log(json); // log the returned json to the console
            console.log("success"); // another sanity check
        },
        // handle a non-successful response
        error : function(xhr,errmsg,err) {
            console.log(xhr.status + ": " + xhr.responseText); // provide a bit more info about the error to the console
        },
        method: 'POST'
    }));
}

function show_detail(event) {
    event.preventDefault();
    var sisterCheckbox = $(this).parents('tr').find('input');
    var jsonData = sisterCheckbox.data('content');
    renderRecordDetail(jsonData);
}

// This function has been obsoleted by RecordDetailView. It can be removed
// when the server returns HPB search results in the {uri, content} format.
function renderRecordDetail(attributes) {
    var dataAsArray = _(attributes).omit('uri').map(function(value, key) {
        return {key: key, value: value};
    }).value();
    var template = JST['item-fields'];
    var target = $('#result_detail');
    target.find('.modal-title').text(attributes.uri);
    target.find('.modal-body').html(template({fields: dataAsArray}));
    $("#result_detail").modal('show');
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
        if (options.filters) {
            urlParts.push(objectAsUrlParams(options.filters));
        }
        var fetchOptions = _(options).omit(['filters']).extend({
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
        var id = record.id;
        return _.map(record.get('content'), function(value, key) {
            return {id: id, key: key, value: value};
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
        this.listenTo(this.underlying, 'add change', this.toFlat);
        this.on('add change', _.debounce(this.fromFlat), this);
        // this.listenTo(this.underlying, 'remove', TODO);
        // this.on('remove', TODO);
    },
    // translate the official representation to the flat one
    toFlat: function(annotation) {
        var id = annotation.id,
            groupId = annotation.get('managing_group'),
            groupName = allGroups.get(groupId).get('name'),
            content = annotation.get('content'),
            existing = this.filter({group: groupName}),
            replacements = _.map(content, function(value, key) {
                return {id: id, key: key, value: value, group: groupName};
            }),
            obsolete = _.differenceBy(existing, replacements, this.modelId);
        // After the next two lines, this.models will be up-to-date and
        // appropriate events will have been triggered.
        this.remove(obsolete);
        this.add(replacements, {merge: true});
    },
    // translate the flat representation to the official one, save immediately
    fromFlat: function(flatAnnotation) {
        var groupName = flatAnnotation.get('group'),
            groupId = allGroups.findWhere({name: groupName}).id,
            existing = this.underlying.findWhere({managing_group: groupId}),
            id = existing && existing.id,
            allFlat = this.where({group: groupName}),
            content = _(allFlat).map('attributes').map(function(attributes) {
                return [attributes.key, attributes.value];
            }).fromPairs().value(),
            replacement = {
                id: id,
                record: this.record.get('id'),
                managing_group: groupId,
                content: content,
            },
            annotation = this.underlying.add(replacement, {merge: true});
        annotation.save(null, {silent: true});
    },
});

var Record = APIModel.extend({
    idAttribute: 'uri',
    getAnnotations: function() {
        if (!this.annotations) {
            this.annotations = new Annotations();
            this.annotations.query({filters: {record__uri: this.id}});
        }
        return this.annotations;
    },
});

var Records = APICollection.extend({
    url: '/vre/api/records',
    model: Record,
});

/**
 * Representation of a single VRE collection.
 */
var Collection = APIModel.extend({
    getRecords: function() {
        if (!this.records) {
            this.records = new Records();
            this.records.query({filters: {collection__id: this.id}});
        }
        return this.records;
    },
});

var Collections = APICollection.extend({
    url: '/vre/api/collections',
    model: Collection,
}, {
    /**
     * Class method for retrieving only the collections the user can manage.
     */
    mine: function() {
        var myCollections = new Collections();
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

var RecordListView = LazyTemplateView.extend({
    tagName: 'form',
    templateName: 'record-list',
    events: {
        submit: 'submitForm',
    },
    initialize: function(options) {
        this.items = [];
        this.render();
        this.listenTo(this.collection, {
            add: this.addItem,
        });
    },
    render: function() {
        this.$el.html(this.template({}));
        this.$tbody = this.$('tbody');
        this.renderItems();
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
    submitForm: function(event) {
        // for now, this is a no-op
        event.preventDefault();
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
        this.$el.html(this.template(this));
        var model = this.model;
        this.$('input').val(function(index, oldValue) {
            return model.get(this.name);
        }).last().focus();  // TODO: focus doesn't work yet
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
        this.listenTo(this.collection, 'add change', this.insertRow);
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
        this.$el.html(this.template({title: this.title}));
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
        // first, remove the inline form
        this.rows.splice(_.indexOf(this.rows, editRow), 1);
        editRow.remove();
        // then, add the model (will re-insert static row because of add event)
        this.collection.add(editRow.model, {merge: true});
    },
});

var RecordDetailView = LazyTemplateView.extend({
    el: '#result_detail',
    initialize: function(options) {
        this.$title = this.$('.modal-title');
        this.$body = this.$('.modal-body');
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
        ':id/': 'showCollection',
    },
    showCollection: function(id) {
        // The if-condition is a bit of a hack, which can go away when we
        // convert to client side routing entirely.
        if ($('#select_records').length === 0) {
            // We are not on the HPB search results page, so display the
            // records in the current selection instead.
            var collection = allCollections.get(id);
            var records = collection.getRecords();
            var recordsList = new RecordListView({collection: records});
            recordsList.render().$el.insertAfter('#search');
        }
    },
});

// Global object to hold the templates, initialized at page load below.
var JST = {};

var allCollections = new Collections();
var allGroups = new ResearchGroups();
var myGroups, groupMenu;
var recordDetailModal = new RecordDetailView();
var router = new VRERouter();

$(function() {
    $('script[type="text/x-handlebars-template"]').each(function(i, element) {
        $el = $(element);
        JST[$el.prop('id')] = Handlebars.compile($el.html(), {compat: true});
    });
    $("#select_records").submit(return_selected_records);
    $('#select_records a').click(show_detail);
    $('#result_detail').modal({show: false});
    // We fetch the collections and ensure that we have them before we handle
    // the route, because VRERouter.showCollection depends on them being
    // available. This is something we can definitely improve upon.
    allCollections.fetch().then(function() {
        Backbone.history.start({
            pushState: true,  // this enables matching the path of the URL
            root: '/vre/',
        });
    });
    allGroups.fetch();
    myGroups = ResearchGroups.mine();
    groupMenu = new GroupMenuView({collection: myGroups});
});
