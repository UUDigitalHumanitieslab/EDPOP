import { LazyTemplateView } from '../utils/lazy.template.view';

export var HPBView = LazyTemplateView.extend({
    templateName:"hpb-view",
    id: "content",
    initialize: function() {
        this.render();
    },
    render: function() {
        this.$el.html(this.template());
        return this;
    },
});

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

export var CollectionView = LazyTemplateView.extend({
    templateName:"collection-view",
    id:"content",
    initialize: function() {
        this.render();
    },
    render: function() {
        this.$el.html(this.template(this.model.attributes));
        return this;
    },
});
