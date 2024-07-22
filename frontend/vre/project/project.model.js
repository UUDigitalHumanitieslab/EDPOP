import { APICollection } from '../utils/api.model';

export var Projects = APICollection.extend({
    url: '/api/projects/',
}, {
    mine: function () {
        var myProjects = new Projects();
        myProjects.fetch({ url: myProjects.url + 'mine/' });
        return myProjects;
    },
});
