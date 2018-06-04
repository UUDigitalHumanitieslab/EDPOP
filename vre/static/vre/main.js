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
    'Subject Headings': 52,
};

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

/**
 * Perform the following transformation:
 * (from)  {foo: 'bar', foobar: 'baz'}
 * (to)    'foo=bar&foobar=baz'
 */
function objectAsUrlParams(object) {
    return _(object).entries().invokeMap('join', '=').join('&');
}

/**
/* Sorting in a canonical order, for FlatFields and FlatAnnotations.
*/
function canonicalSort(key) {
    var index = (canonicalOrder[key] || 100);
    return index;
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
 * flat alternative: [{key, value}]
 *
 * Note that we extend directly from Backbone.Collection rather than from
 * APICollection and that we don't set a URL. This is because we only talk
 * to the server through the underlying Record model.
 */
var FlatFields = Backbone.Collection.extend({
    model: Field,
    comparator: function(item) {
        return canonicalSort(item.attributes.key);
    },
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
 * flat alternative: [{key, value, group}]
 */
var FlatAnnotations = Backbone.Collection.extend({
    // comparator: can be set to keep this sorted
    // How to uniquely identify a field annotation.
    comparator: function(item) {
        return canonicalSort(item.attributes.key);
    },
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
        return response.result_list;
    }
});

/**
 * Representation of a single VRE collection.
 */
var VRECollection = Backbone.Model.extend({
    getRecords: function() {
        if (!this.records) {
            var records = this.records = new Records();
            records.query({
                params: {collection__id: this.id},
            }).then(function() {
                records.trigger('complete');
            });
        }
        return records;
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

/**
 * Reusable alert view. Meant to be displayed once and then discarded.
 *
 * The methods with a `complete` parameter accept three types of values:
 *
 *  1. any function, which will be executed after the animation completes;
 *  2. a string, which should be the name of a method of the alert view;
 *  3. undefined, in which case nothing is done after the animation completes.
 */
var AlertView = LazyTemplateView.extend({
    ease: 500,
    delay: 2000,
    className: 'alert alert-dismissible',
    templateName: 'alert-view',
    attributes: {
        role: 'alert',
    },
    initialize: function(options) {
        _.assign(this, _.pick(options, ['level', 'message', 'ease', 'delay']));
    },
    render: function() {
        this.$el.addClass(this.getLevelClass()).html(this.template(this));
        return this;
    },
    // Show and hide automatically, then execute `complete`.
    animate: function(complete) {
        var followUp = _.bind(this.animateOut, this, complete);
        // The _.partial(...) below is a shorthand for _.bind(function() {
        //     _.delay(followUp, this.delay);
        // }, this), where _.delay in turn is a shorthand for setTimeout.
        return this.animateIn(_.partial(_.delay, followUp, this.delay));
    },
    // Show with ease and then execute `complete`.
    animateIn: function(complete) {
        this.$el.show(this.ease, this.wrapComplete(complete));
        return this;
    },
    // Hide with ease and then execute `complete`.
    animateOut: function(complete) {
        this.$el.hide(this.ease, this.wrapComplete(complete));
        return this;
    },
    getLevelClass: function() {
        return 'alert-' + this.level;
    },
    // Utility function that enables the "string as method name" magic.
    wrapComplete: function(complete) {
        return this[complete] && this[complete].bind(this) || complete;
    },
});

var VRECollectionView = LazyTemplateView.extend({
    templateName: 'collection-selector',
    events: {
        'click button': 'submitForm',
        'change select': 'activateButton',
    },
    render: function() {
        var shownCollections = this.collection.clone();
        shownCollections.remove(currentVRECollection);
        this.$el.html(this.template({models: shownCollections.toJSON()}));
        this.$('select').select2();
        return this;
    },
    setRecord: function(model) {
        this.model = model;
        return this;
    },
    clear: function() {
        this.$el.val(null).trigger('change');
        return this;
    },
    activateButton: function(event) {
        event.preventDefault();
        if (this.$('select').val().length) {
            this.$('button').removeClass("disabled");
        }
        else {
            this.$('button').addClass("disabled");
        }
    },
    submitForm: function(event) {
        event.preventDefault();
        var selected_records = [];
        if (this.model) {
            // adding to array as the api expects an array.
            selected_records.push(this.model.toJSON());
        }
        else {
            selected_records = _(recordsList.items).filter({selected: true}).invokeMap('model.toJSON').value();
        }
        var selected_collections = this.$('select').val();
        var records_and_collections = new AdditionsToCollections({
            'records': selected_records,
            'collections': selected_collections,
        });
        records_and_collections.save().then(
            this.showSuccess.bind(this),
            this.showError.bind(this),
        );
    },
    showSuccess: function(response) {
        var feedbackString = '';
        $.each(response, function(key, value) {
            feedbackString = feedbackString.concat('Added ', value, ' record(s) to ', key, ". ");
        });
        this.showAlert('success', feedbackString);
    },
    showError: function(response) {
        this.showAlert('warning', response.responseJSON.error);
    },
    showAlert: function(level, message) {
        var alert = new AlertView({level: level, message: message});
        alert.render().$el.prependTo(this.el);
        alert.animate('remove');
    },
});

var SearchView= LazyTemplateView.extend({
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

var AdvancedSearchView = LazyTemplateView.extend({
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

/**
 * Common base for views that provide behaviour revolving around a
 * single checkbox. When deriving a subclass, bind the `toggle`
 * method to the right checkbox and set `this.$checkbox` in the
 * `render` method.
 */
var SelectableView = LazyTemplateView.extend({
    toggle: function(event) {
        // The assignment in the if condition is on purpose (assign + check).
        if (this.selected = event.target.checked) {
            this.trigger('check');
        } else {
            this.trigger('uncheck');
        }
    },
    check: function() {
        this.$checkbox.prop('checked', true);
        this.selected = true;
        return this;
    },
    uncheck: function() {
        this.$checkbox.prop('checked', false);
        this.selected = false;
        return this;
    },
});

var SelectAllView = SelectableView.extend({
    className: 'checkbox',
    templateName: 'select-all-view',
    events: {
        'change input': 'toggle',
    },
    render: function() {
        this.$el.html(this.template({}));
        this.$checkbox = this.$('input');
        return this;
    },
});

var RecordListItemView = SelectableView.extend({
    tagName: 'tr',
    templateName: 'record-list-item',
    events: {
        'change input': 'toggle',
        'click a': 'display',
    },
    render: function() {
        this.$el.html(this.template(this.model.attributes));
        this.$checkbox = this.$('input');
        return this;
    },
    display: function(event) {
        recordDetailModal.setModel(this.model).render();
    },
});

var RecordListView = LazyTemplateView.extend({
    tagName: 'form',
    templateName: 'record-list',
    events: {
        'submit': function(event) {
            this.vreCollectionsSelect.submitForm(event);
        },
        'click #more-records': 'loadMore',
    },
    initialize: function(options) {
        this.items = [];
        this.checkedCount = 0;
        this.listenTo(this.collection, {
            add: this.addItem,
            reset: this.render,
            complete: this.showSelectAll,
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
        item.on({check: this.checkOne, uncheck: this.uncheckOne}, this);
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
    loadMore: function(event) {
        searchView.nextSearch(event);
    },
    showSelectAll: function() {
        var selectAllView = this.selectAllView = new SelectAllView();
        this.$('table').before(selectAllView.render().el);
        selectAllView.on({
            check: this.checkAll,
            uncheck: this.uncheckAll,
        }, this).listenTo(this, {
            allChecked: selectAllView.check,
            notAllChecked: selectAllView.uncheck,
        });
    },
    checkOne: function() {
        if (++this.checkedCount === this.collection.length) {
            this.trigger('allChecked');
        }
        return this;
    },
    uncheckOne: function() {
        --this.checkedCount;
        this.trigger('notAllChecked');
        return this;
    },
    checkAll: function() {
        this.checkedCount = this.collection.length;
        _.invokeMap(this.items, 'check');
        return this;
    },
    uncheckAll: function() {
        this.checkedCount = 0;
        _.invokeMap(this.items, 'uncheck');
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
        this.vreCollectionsSelect.clear().setRecord(model);
        this.annotationsView.listenTo(this.fieldsView, 'edit', this.annotationsView.edit);
        var uriText = this.model.get('uri');
        this.$title.text(uriText);
        document.getElementById("uri-link").href = uriText;
        this.fieldsView.render().$el.appendTo(this.$body);
        this.annotationsView.render().$el.appendTo(this.$body);
        return this;
    },
    render: function() {
        this.$footer.prepend(this.vreCollectionsSelect.render().$el);
        this.$el.modal('show');
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
            var savedId = localStorage.getItem('researchGroup');
            if (savedId) {
                var savedGroup = this.collection.get(savedId);
                this.select(savedGroup);
            }
            else {
                this.select(this.collection.first());
            }
        }
    },
    select: function(model) {
        if (model === this.model) return;
        this.model = model;
        this.render();
        this.trigger('select', model);
        localStorage.setItem('researchGroup', model.attributes.id);
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
var JST = {};
var currentVRECollection;
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


function prepareCollectionViews() {
    recordDetailModal = new RecordDetailView();
    dropDown = new SelectSourceView({collection:myCollections});
    dropDown.$el.appendTo($('.nav').first());
}

$(function() {
    $('script[type="text/x-handlebars-template"]').each(function(i, element) {
        $el = $(element);
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
