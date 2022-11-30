import _ from 'lodash';
import { LazyTemplateView } from '../utils/lazy.template.view';
import { GlobalVariables } from '../globals/variables';

/**
 * Common base for views that provide behaviour revolving around a
 * single checkbox. When deriving a subclass, bind the `toggle`
 * method to the right checkbox and set `this.$checkbox` in the
 * `render` method.
 */
export var SelectableView = LazyTemplateView.extend({
    toggle: function(event) {
        // The assignment in the if condition is on purpose (assign + check).
        event.preventDefault();
        if (this.selected = event.target.checked) {
            this.trigger('check');
        } else {
            this.trigger('uncheck');
        }
    },
    check: function() {
        this.$checkbox.prop('checked', true);
        this.selected = true;
        return this;
    },
    uncheck: function() {
        this.$checkbox.prop('checked', false);
        this.selected = false;
        return this;
    },
});

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

export var RecordListItemView = SelectableView.extend({
    tagName: 'tr',
    templateName: 'record-list-item',
    events: {
        'change input': 'toggle',
        'click a': 'display',
    },
    initialize: function() {
        if (!this.model.get('content').Title) {
            this.model.getAnnotations().once('sync', this.render, this);
        }
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