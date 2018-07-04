import { LazyTemplateView } from '../utils/lazy.template.view';

export var SelectSourceView = LazyTemplateView.extend({
    templateName: 'database-menu',
    tagName: 'li',
    className: 'dropdown',
    initialize: function() {
        this.render();
    },
    render: function() {
        var collections = {'collections': this.collection.toJSON()};
        this.$el.html(this.template(collections));
    },
});