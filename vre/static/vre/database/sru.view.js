import { View } from 'backbone';
import sruTemplate from './sru.view.mustache';

export var SRUView = View.extend({
    template: sruTemplate,
    id: "content",
    initialize: function() {
        this.render();
    },
    render: function() {
        this.$el.html(this.template());
        return this;
    },
});
