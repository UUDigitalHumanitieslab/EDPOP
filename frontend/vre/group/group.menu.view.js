import { CollectionView } from 'backbone-fractal';

import { GroupMenuItemView } from './group.menu.item.view';
import groupMenuTemplate from './group.menu.view.mustache';

export var GroupMenuView = CollectionView.extend({
    el: '#vre-group-menu',
    template: groupMenuTemplate,
    container: '.dropdown-menu',

    initialize: function(options) {
        this.$header = this.$('.dropdown-toggle');
        this.initItems().restoreSelection().render().initCollectionEvents()
        .listenTo(this.collection, 'update reset', this.restoreSelection);
    },

    renderContainer: function() {
        this.$header.html(this.template(this.model.attributes));
        return this;
    },

    makeItem: function(group) {
        var item = new GroupMenuItemView({model: group});
        item.on('select', this.select, this);
        item.listenTo(this, 'select', item.activate);
        return item;
    },

    restoreSelection: function(collection) {
        if (!this.model || !this.collection.includes(this.model)) {
            var savedId = localStorage.getItem('researchGroup');
            if (savedId) {
                var savedGroup = this.collection.get(savedId);
                this.select(savedGroup);
            }
            else {
                this.select(this.collection.first());
            }
        }
        return this;
    },

    select: function(model) {
        if (model === this.model) return;
        this.model = model;
        this.renderContainer();
        this.trigger('select', model);
        localStorage.setItem('researchGroup', model.attributes.id);
    },
});