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

function show_detail() {
    $("#result_detail").css("display", "inline");
}