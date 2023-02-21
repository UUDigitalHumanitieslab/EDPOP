import { Records } from '../record/record.model';

export var SearchResults = Records.extend({
    url:'/api/search',
    total_results: 0,
    parse: function(response) {
        this.total_results = response.total_results;
        return response.result_list;
    }
});