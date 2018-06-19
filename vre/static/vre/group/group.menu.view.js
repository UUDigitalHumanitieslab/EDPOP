import { LazyTemplateView } from '../utils/lazy.template.view'

export var GroupMenuItemView = LazyTemplateView.extend({
    tagName: 'li',
    templateName: 'group-menu-item',
    events: {
        'click': 'select',
    },
    render: function() {
        this.$el.html(this.template(this.model.attributes));
        return this;
    },
    select: function(event) {
        this.trigger('select', this.model);
    },
    activate: function(model) {
        if (model === this.model) {
            this.$el.addClass('active');
        } else {
            this.$el.removeClass('active');
        }
    },
});

export var GroupMenuView = LazyTemplateView.extend({
    el: '#vre-group-menu',
    templateName: 'group-menu-header',
    initialize: function(options) {
        this.$header = this.$('.dropdown-toggle');
        this.$list = this.$('.dropdown-menu');
        this.items = [];
        this.resetItems(this.collection);
        this.listenTo(this.collection, 'update reset', this.resetItems);
    },
    resetItems: function(collection) {
        _.invokeMap(this.items, 'remove');
        this.items = this.collection.map(_.bind(function(group) {
            var item = new GroupMenuItemView({model: group});
            item.on('select', this.select, this);
            item.listenTo(this, 'select', item.activate);
            return item;
        }, this));
        this.$list.append(_(this.items).invokeMap('render').map('el').value());
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
    },
    select: function(model) {
        if (model === this.model) return;
        this.model = model;
        this.render();
        this.trigger('select', model);
        localStorage.setItem('researchGroup', model.attributes.id);
    },
    render: function() {
        this.$header.html(this.template(this.model.attributes));
    },
});