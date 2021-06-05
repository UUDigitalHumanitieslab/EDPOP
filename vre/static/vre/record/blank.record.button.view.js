import Backbone from 'backbone';
import { GlobalVariables } from '../globals/variables';
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
        GlobalVariables.recordDetailModal.setModel(new Record({
            content: {},
        })).render();
    },
});
