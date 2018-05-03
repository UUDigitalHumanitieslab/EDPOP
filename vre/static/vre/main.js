
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

function submitSearch(event) {
    event.preventDefault();
    var searchTerm = $(event.target).find('input[name="search"]').val();
    results.query({params:{search:searchTerm, source:1}}).then( function () {
        $('#more_records').show();
    });
    recordsList.remove()
    recordsList = new RecordListView({collection: results});
    recordsList.render().$el.insertAfter('#search');
}

function retrieveMoreRecords(event) {
    event.preventDefault();
    $('#more_records').hide();
    var searchTerm = $('input[name="search"]').val();
    var noCurrentRecords = $.find('tr').length+1;
    var newResults = new HPBSearch();
    newResults.query({params:{search:searchTerm, startRecord:noCurrentRecords}}).then(
        function () {
            results.add(newResults.models);
            $('#more_records').show();
    });
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
 * Generic subclass that supports filtering at the backend.
 */
var APICollection = Backbone.Collection.extend({
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

var Annotations = APICollection.extend({
    url: '/vre/api/annotations',
});

/**
 * This is an alternative, flat representation of the annotations for a
 * given option.record. Its purpose is to be easier to represent and manage
 * from a view. It proxies to a normal Annotations (see above), using event
 * bindings to keep the two representations in sync.
 *
 * normal: {id, record, managing_group, content}
 * flat alternative: {id, key, value, group}
 *
 * Note that we extend directly from Backbone.Collection rather than from
 * APICollection and that we don't set a URL. This is because we only talk
 * to the server through the underlying Annotations collection.
 */
// (This is a trick we could use more often.)
var FlatAnnotations = Backbone.Collection.extend({
    // comparator: can be set to keep this sorted
    // How to uniquely identify a field annotation.
    modelId: function(attributes) {
        return attributes.key + attributes.id;
    },
    initialize: function(models, options) {
        _.assign(this, _.pick(options, ['record']));
        this.underlying = this.record.getAnnotations();
        this.underlying.forEach(this.toFlat.bind(this));
        this.listenTo(this.underlying, 'add change', this.toFlat);
        // this.listenTo(this.underlying, 'remove', TODO);
        // this.on('add change', this.fromFlat);
        // this.on('remove', TODO);
    },
    // translate the official representation to the flat one
    toFlat: function(annotation) {
        var id = annotation.id,
            groupId = annotation.get('managing_group'),
            groupName = allGroups.get(groupId).get('name'),
            content = annotation.get('content'),
            existing = this.filter({id: id}),
            replacements = _.map(content, function(value, key) {
                return {id: id, key: key, value: value, group: groupName};
            }),
            obsolete = _.differenceBy(existing, replacements, this.modelId);
        // After the next two lines, this.models will be up-to-date and
        // appropriate events will have been triggered.
        this.remove(obsolete);
        this.add(replacements, {merge: true});
    },
    // translate the flat representation to the official one
    fromFlat: function(flatAnnotation) {
        // TODO
    },
});

var Record = Backbone.Model.extend({
    idAttribute: 'uri',
    getAnnotations: function() {
        if (!this.annotations) {
            this.annotations = new Annotations();
            this.annotations.query({filters: {record__uri: this.id}});
        }
        return this.annotations;
    },
});

var AdditionsToCollections = Backbone.Model.extend({
    url: 'add-selection',
})

var Records = APICollection.extend({
    url: '/vre/api/records',
    model: Record,
});

var HPBSearch = Records.extend({
    url:'/vre/api/search',
    total_results: 0,
    parse: function(response) {
        this.total_results = response.total_results;
        var displayString = "Showing ".concat(response.result_list.length, " of ", this.total_results, " results");    
        $("h4").html(displayString);
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
            this.records.query({filters: {collection__id: this.id}});
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
        'click #add': 'submitForm',
    },
    initialize: function(options) {
        this.data = allCollections.map(
            function(d) {
                return {
                    id: d.id,
                    text: d.get('description'),
                };
            });
        //this.render();
    },
    render: function() {
        this.$el.html(this.template({}));
        this.$('select[name="collections"]').select2({data: this.data});
        /*this.$el.html(this.template({models: this.collection.toJSON()}));
        this.$('#select-collections').select2({});*/
        return this;
    },
    submitForm: function(event) {
        event.preventDefault();
        if (this.model) {
            var selected_records = [];
            selected_records.push(this.model);
        }
        else {
            var selected_records = _(recordsList.items).filter({selected: true}).invokeMap('model.toJSON').value();
        }
        var selected_collections = $('select[name="collections"]').val();
        var records_and_collections = new AdditionsToCollections({
            'records': selected_records,
            'collections': selected_collections,
        });
        records_and_collections.save();
    },
});

var RecordListView = LazyTemplateView.extend({
    tagName: 'form',
    templateName: 'record-list',
    initialize: function(options) {
        this.items = [];
        this.listenTo(this.collection, {
            add: this.addItem,
        });
        this.vreCollectionsSelect = new VRECollectionView({collection: myCollections});
    },
    render: function() {
        this.$el.html(this.template({}));
        this.vreCollectionsSelect.render();    
        this.$el.prepend(this.vreCollectionsSelect.$el);
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
        event.preventDefault();
        var selected_indices = this.$tbody.find(':checked').parents('tr').map( function() {
            return this.rowIndex;
        }).get();
        selected_records = this.collection.filter( function(d, i) { 
            return _.includes(selected_indices, i) 
        });
        var selected_collections = $('#select-collections').val();
        var records_and_collections = {'records': selected_records, 'collections': selected_collections}
        $.ajax(addCSRFToken({
            url: 'add-selection',
            contentType:'application/json',
            data: JSON.stringify(records_and_collections),
            success : function(json) {
                var feedback_string = new String();
                $.each(json, function(k, v) {
                    //display the key and value pair
                    feedback_string = feedback_string.concat('Added ', v, ' record(s) to ', k, ". ");
                });
                $('#add_feedback').html(feedback_string).show(1000, function() {
                    setTimeout(function() {
                        $('#add_feedback').hide(1000);
                    }, 2000)
                });
                console.log("success"); // sanity check
            },
            // handle a non-successful response
            error : function(xhr,errmsg,err) {
                console.log(xhr.status + ": " + xhr.responseText); // provide a bit more info about the error to the console
            },
            method: 'POST'
    }));
    },
});
  
        
/**
 * Displays a single model from a FlatAnnotations collection.
 */
var FieldAnnotationView = LazyTemplateView.extend({
    tagName: 'tr',
    templateName: 'item-field-annotation',
    render: function() {
        this.$el.html(this.template(this.model.attributes));
        return this;
    },
});

var SelectSourceView = LazyTemplateView.extend({
    templateName: 'nav-dropdown',
    render: function() {
        this.$el.html(this.template(this.collection));
        this.$el.appendTo($('nav'));
    },
    // potentially, route to HPB / or "collection.id" here
});

var RecordDetailView = LazyTemplateView.extend({
    el: '#result_detail',
    templateName: 'item-fields',
    initialize: function(options) {
        this.$title = this.$('.modal-title');
        this.$body = this.$('.modal-body');
        this.$footer = this.$('.modal-footer');
        this.annotationRows = [];
    },
    setModel: function(model) {
        if (this.model) {
            if (this.model === model) return this;
            this.stopListening(this.annotations);
            this.annotations.stopListening();
            _.invokeMap(this.annotations.models, 'stopListening');
            _.invokeMap(this.annotationRows, 'stopListening');
        }
        this.model = model;
        this.annotations = new FlatAnnotations(null, {record: model});
        this.annotationRows = this.annotations.map(this.createRow);
        this.listenTo(this.annotations, 'add', this.insertRow);
        return this;
    },
    createRow: function(annotation) {
        return new FieldAnnotationView({model: annotation});
    },
    insertRow: function(annotation, collection, options) {
        var row = this.createRow(annotation),
            el = row.render().el,
            index = collection.indexOf(annotation);
        if (index + 1 === collection.length) {
            this.annotationRows.push(row);
            this.$('tbody').last().append(row.render().el);
        } else {
            this.annotationRows.splice(index, 0, row);
            this.$('tbody').last().children().eq(index).before(el);
        }
    },
    render: function() {
        var attributes = this.model.get('content');
        var dataAsArray = _(attributes).map(function(value, key) {
            return {key: key, value: value};
        }).value();
        this.$title.text(this.model.get('uri'));
        _.invokeMap(this.annotationRows, 'remove');
        this.$body.html(this.template({fields: dataAsArray}));
        this.$el.modal('show');
        this.$('tbody').last().append(
            _(this.annotationRows).invokeMap('render').map('el').value()
        );
        this.$footer = this.$('.modal-footer');
        this.vreCollectionsSelect = new VRECollectionView({collection: myCollections, model: this.model});
        this.vreCollectionsSelect.render();
        this.$footer.prepend(this.vreCollectionsSelect.$el);
        return this;
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
            recordsList.remove();
            recordsList = new RecordListView({collection: records});
            recordsList.render().$el.appendTo($('body'));
        }
    },
});

// Global object to hold the templates, initialized at page load below.
var JST = {};
var allCollections = new VRECollections();
var myCollections = new VRECollections().mine;
var dropDown;
myCollections.on('sync', function(){ 
    dropDown = new SelectSourceView({collection: myCollections});
});
var allGroups = new ResearchGroups();
var recordDetailModal = new RecordDetailView();
var recordsList = new RecordListView();
var router = new VRERouter();
var results = new HPBSearch();

$(function() {
    $('script[type="text/x-handlebars-template"]').each(function(i, element) {
        $el = $(element);
        JST[$el.prop('id')] = Handlebars.compile($el.html());
    });
    //$("#select_records").submit(return_selected_records);
    $('#select_records a').click(show_detail);
    $('#result_detail').modal({show: false});
    $('#search').submit(submitSearch);
    $('#more_records').click(retrieveMoreRecords);
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
});
