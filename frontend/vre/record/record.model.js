import { APIModel, APICollection } from '../utils/api.model';
import{ Annotations } from '../annotation/annotation.model';

export var Record = APIModel.extend({
    urlRoot: '/api/records',
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

export var Records = APICollection.extend({
    url: '/api/records',
    model: Record,
});