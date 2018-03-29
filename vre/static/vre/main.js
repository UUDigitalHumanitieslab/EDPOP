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
    var dataAsArray = _(jsonData).omit('uri').map(function(value, key) {
        return {key: key, value: value};
    }).value();
    var template = Handlebars.compile($('#item-fields').html());
    var target = $('#result_detail');
    target.find('.modal-title').text(jsonData.uri);
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

var Records = APICollection.extend({
    url: '/vre/api/records',
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

$(function() {
    $("#select_records").submit(return_selected_records);
    $('#select_records a').click(show_detail);
    $('#result_detail').modal({show: false});
});
