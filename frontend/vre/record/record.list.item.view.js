import _ from 'lodash';
import { vreChannel } from '../radio';
import { SelectableView } from '../utils/selectable.view';
import recordListItemTemplate from './record.list.item.view.mustache';

/*
 * Note: the display of existing annotations has temporarily been
 * removed from this view. Refer to git history to see how it was implemented.
 */

export var RecordListItemView = SelectableView.extend({
    /**
     * @type Record
     */
    model: null,
    tagName: 'tr',
    template: recordListItemTemplate,
    events: {
        'change input': 'toggle',
        'click a': 'display',
    },
    initialize: function() {
        this.render();
    },
    render: function() {
        var data = this.model.toJSON();
        this.$el.html(this.template({
            data: data, displayText: this.model.getMainDisplay()
        }));
        this.$checkbox = this.$('input');
        return this;
    },
    display: function(event) {
        event.preventDefault();
        vreChannel.trigger('displayRecord', this.model);
    },
});