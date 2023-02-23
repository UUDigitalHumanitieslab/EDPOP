import Backbone from 'backbone';
import { vreChannel } from '../radio';
import { Record } from './record.model';

export var BlankRecordButtonView = Backbone.View.extend({
    tagName: 'li',
    events: {
        'click': 'launchBlank',
    },
    initialize: function() {
        this.render();
    },
    render: function() {
        this.$el.html('<a href="#">Create Blank Record</a>');
        return this;
    },
    launchBlank: function() {
        vreChannel.trigger('displayRecord', new Record({
            content: {},
        }));
    },
});
