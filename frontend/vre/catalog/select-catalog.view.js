import Backbone from 'backbone';
import selectDBTemplate from './select-catalog.view.mustache';
import {GlobalVariables} from "../globals/variables";

export var SelectCatalogView = Backbone.View.extend({
    template: selectDBTemplate,
    tagName: 'li',
    className: 'dropdown',
    events: {
        'click li': 'select',
    },
    initialize: function() {
        this.render();
    },
    getCatalogs: function() {
        const catalogs = _.sortBy(this.collection.toJSON(), 'name');
        console.log(catalogs);
        const currentCatalog = GlobalVariables.currentCatalog;
        if (currentCatalog) {
            catalogs.find((el) => el["@id"] === currentCatalog.get("@id")).selected = true;
        }
        return catalogs;
    },
    render: function() {
        var context = {
            'catalogs': this.getCatalogs(),
        };
        this.$el.html(this.template(context));
    },
    select: function(event) {
        event.preventDefault();
        var href = $(event.target).attr('href');
        Backbone.history.navigate(href, true);
        var selectedDB = event.target.innerText;
        this.$el.html(this.template({'catalogs': this.getCatalogs()}));
    },
});