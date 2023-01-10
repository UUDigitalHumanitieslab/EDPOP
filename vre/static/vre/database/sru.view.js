import { LazyTemplateView } from '../utils/lazy.template.view';

export var SRUView = LazyTemplateView.extend({
    templateName:"sru-view",
    id: "content",
    initialize: function() {
        this.render();
    },
    render: function() {
        this.$el.html(this.template());
        return this;
    },
});
