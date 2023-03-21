import { SelectableView } from '../utils/selectable.view';
import selectAllTemplate from './select-all.view.mustache';

export var SelectAllView = SelectableView.extend({
    className: 'checkbox',
    template: selectAllTemplate,
    events: {
        'change input': 'toggle',
    },
    initialize: function() {
        this.render();
    },
    render: function() {
        this.$el.html(this.template({}));
        this.$checkbox = this.$('input');
        return this;
    },
});
