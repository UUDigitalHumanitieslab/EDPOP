$("#select_records").submit(return_selected_records);

function isChecked(index, item) {
    return item.checked;
}

function getContent(index, item) {
    return $(item).data('content');
}

function return_selected_records(event) {
    event.preventDefault();
    var selected = $(this).find("input").filter(isChecked).map(getContent).get();
    var csrftoken = Cookies.get('csrftoken');
    $.ajax({
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
        headers: {'X-CSRFToken': csrftoken},
        method: 'POST'
    });
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

$(function() {
    $('#select_records a').click(show_detail);
    $('#result_detail').modal({show: false});
});
