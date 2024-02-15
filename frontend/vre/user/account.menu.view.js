import { View } from 'backbone';
import accountMenuTemplate from './account.menu.view.mustache';

export var AccountMenuView = View.extend({
    el: '#vre-account-menu',
    template: accountMenuTemplate,

    initialize: function(options) {
        this.render().listenTo(this.model, 'change', this.render);
    },

    render: function() {
        console.log(this.model.toJSON());
        this.$el.html(this.template(this.model.attributes));
        return this;
    },
});
