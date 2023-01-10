import { LazyTemplateView } from '../utils/lazy.template.view';

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
