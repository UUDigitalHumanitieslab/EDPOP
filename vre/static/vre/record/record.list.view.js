import { View } from 'backbone';
import { VRECollectionView } from '../collection/collection.view';
import { SelectAllView } from './select-all.view';
import { RecordListItemView } from './record.list.item.view';
import { GlobalVariables } from '../globals/variables';
import recordListTemplate from './record.list.view.mustache';

export var RecordListView = View.extend({
    tagName: 'form',
    template: recordListTemplate,
    events: {
        'submit': function(event) {
        	event.preventDefault();
            this.vreCollectionsSelect.submitForm(event);
        },
        'click #more-records': 'loadMore',
    },
    initialize: function(options) {
        this.items = [];
        this.checkedCount = 0;
        this.listenTo(this.collection, {
            add: this.addItem,
            reset: this.render,
            complete: this.showSelectAll,
        });
    },
    render: function() {
        this.$el.html(this.template({}));
        this.$tbody = this.$('tbody');
        this.renderItems();
        $('#HPB-info').hide();
        this.vreCollectionsSelect = new VRECollectionView({collection: GlobalVariables.myCollections});
        this.vreCollectionsSelect.render();
        this.$el.prepend(this.vreCollectionsSelect.$el);
        return this;
    },
    renderItems: function() {
        this.$tbody.empty();
        this.collection.forEach(this.addItem.bind(this));
        return this;
    },
    addItem: function(model, collection, options) {
        var item = new RecordListItemView({model: model});
        item.on({check: this.checkOne, uncheck: this.uncheckOne}, this);
        var index;
        if (options && (index = options.index) != null && index !== this.items.length) {
            // Insert at the front or in the middle.
            this.items.splice(index, 0, item);
            this.$('tr').eq(index).before(item.render().el);
        } else {
            // Append at the back.
            this.items.push(item);
            this.$tbody.append(item.render().el);
        }
        return this;
    },
    loadMore: function(event) {
        GlobalVariables.searchView.nextSearch(event);
    },
    showSelectAll: function() {
        var selectAllView = this.selectAllView = new SelectAllView();
        this.$('table').before(selectAllView.render().el);
        selectAllView.on({
            check: this.checkAll,
            uncheck: this.uncheckAll,
        }, this).listenTo(this, {
            allChecked: selectAllView.check,
            notAllChecked: selectAllView.uncheck,
        });
    },
    checkOne: function() {
        if (++this.checkedCount === this.collection.length) {
            this.trigger('allChecked');
        }
        return this;
    },
    uncheckOne: function() {
        --this.checkedCount;
        this.trigger('notAllChecked');
        return this;
    },
    checkAll: function() {
        this.checkedCount = this.collection.length;
        _.invokeMap(this.items, 'check');
        return this;
    },
    uncheckAll: function() {
        this.checkedCount = 0;
        _.invokeMap(this.items, 'uncheck');
        return this;
    },
});
