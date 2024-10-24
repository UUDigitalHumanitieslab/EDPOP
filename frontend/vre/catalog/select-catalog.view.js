import Backbone from 'backbone';
import { AggregateView } from '../core/view.js';

import optionDBTemplate from './select-catalog-option.view.mustache';
import selectDBTemplate from './select-catalog.view.mustache';

var CatalogOptionView = Backbone.View.extend({
    template: optionDBTemplate,
    tagName: 'li',
    events: {
        'click': 'select',
    },
    initialize: function() {
        this.render().listenTo(this.model, {
            focus: this.markSelected,
            blur: this.unmarkSelected,
        });
    },
    render: function() {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    },
    markSelected: function() {
        this.$el.addClass('active');
    },
    unmarkSelected: function() {
        this.$el.removeClass('active');
    },
    select: function(event) {
        event.preventDefault();
        var href = $(event.target).attr('href');
        Backbone.history.navigate(href, true);
        this.render();
    },
});

export var SelectCatalogView = AggregateView.extend({
    template: selectDBTemplate,
    tagName: 'li',
    className: 'dropdown',
    subview: CatalogOptionView,
    container: 'ul',
    initialize: function() {
        this.initItems().render().initCollectionEvents();
    },
    renderContainer: function() {
        this.$el.html(this.template());
        return this;
    },
});
