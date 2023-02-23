import _ from 'lodash';
import { GlobalVariables } from '../globals/variables';
import { SelectableView } from '../utils/selectable.view';
import recordListItemTemplate from './record.list.item.view.mustache';

export var RecordListItemView = SelectableView.extend({
    tagName: 'tr',
    template: recordListItemTemplate,
    events: {
        'change input': 'toggle',
        'click a': 'display',
    },
    initialize: function() {
        if (!this.model.get('content').Title) {
            this.model.getAnnotations().once('sync', this.render, this);
        }
        this.render();
    },
    render: function() {
        var data = this.model.toJSON();
        if (!data.content.Title && this.model.annotations) {
            var annoContent = this.model.annotations.map('content');
            data.content = _.defaults.apply(null, [{}, data.content].concat(annoContent));
        }
        this.$el.html(this.template(data));
        this.$checkbox = this.$('input');
        return this;
    },
    display: function(event) {
        event.preventDefault();
        GlobalVariables.recordDetailModal.setModel(this.model).render();
    },
});