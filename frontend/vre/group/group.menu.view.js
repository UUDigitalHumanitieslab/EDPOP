import { CollectionView } from 'backbone-fractal';

import { GroupMenuItemView } from './group.menu.item.view';
import groupMenuTemplate from './group.menu.view.mustache';

export var GroupMenuView = CollectionView.extend({
    el: '#vre-group-menu',
    template: groupMenuTemplate,
    subview: GroupMenuItemView,
    container: '.dropdown-menu',

    initialize: function(options) {
        this.$header = this.$('.dropdown-toggle');
        this.initItems().restoreSelection().render().initCollectionEvents()
        .listenTo(this.collection, {
            'update reset': this.restoreSelection,
            select: this.select,
        });
    },

    renderContainer: function() {
        var attributes = this.model ? this.model.toJSON() : {};
        this.$header.html(this.template(attributes));
        return this;
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
        if (this.model) this.model.trigger('select', this.model);
        return this;
    },

    select: function(model) {
        if (model === this.model) return;
        if (this.model) this.model.trigger('deselect');
        this.model = model;
        this.renderContainer();
        this.trigger('select', model);
        localStorage.setItem('researchGroup', model.attributes.id);
    },
});