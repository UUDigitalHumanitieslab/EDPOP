import { SelectableView } from '../utils/selectable.view';

export var SelectAllView = SelectableView.extend({
    className: 'checkbox',
    templateName: 'select-all-view',
    events: {
        'change input': 'toggle',
    },
    render: function() {
        this.$el.html(this.template({}));
        this.$checkbox = this.$('input');
        return this;
    },
});
