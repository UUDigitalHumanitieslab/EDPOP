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
 * Generic subclass that supports filtering at the backend.
 */
var APICollection = Backbone.Collection.extend({
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

var Annotations = APICollection.extend({
    url: '/vre/api/annotations',
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

var Records = APICollection.extend({
    url: '/vre/api/records',
    model: Record,
});

/**
 * Representation of a single VRE collection.
 */
var Collection = Backbone.Model.extend({
    getRecords: function() {
        if (!this.records) {
            this.records = new Records();
            this.records.query({collection__id: this.id});
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
        renderRecordDetail(_.defaults(
            {uri: this.model.get('uri')},
            this.model.get('content'),
        ));
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
var router = new VRERouter();

$(function() {
    $('script[type="text/x-handlebars-template"]').each(function(i, element) {
        $el = $(element);
        JST[$el.prop('id')] = Handlebars.compile($el.html());
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
});
