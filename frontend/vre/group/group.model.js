import { APICollection } from '../utils/api.model';

export var ResearchGroups = APICollection.extend({
    url: '/api/researchgroups/',
}, {
    /**
     * Class method for retrieving only the research groups of the user.
     */
    mine: function() {
        var myResearchGroups = new ResearchGroups();
        myResearchGroups.fetch({url: myResearchGroups.url + 'mine/'});
        return myResearchGroups;
    },
});
