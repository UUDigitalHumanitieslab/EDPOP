import _ from 'lodash';
import { CollectionView } from 'backbone-fractal';
import { RecordListItemView } from './record.list.item.view';
import recordListTemplate from './record.list.view.mustache';

export var RecordListView = CollectionView.extend({
    tagName: 'table',
    className: 'table table-striped',
    template: recordListTemplate,
    container: 'tbody',

    initialize: function(options) {
        this.initItems().render().initCollectionEvents();
        this.checkedCount = 0;
    },

    renderContainer: function() {
        this.$el.html(this.template({}));
        return this;
    },

    makeItem: function(model, collection, options) {
        return new RecordListItemView({model: model}).on({
            check: this.checkOne,
            uncheck: this.uncheckOne,
        }, this);
    },

    currentSelection: function() {
        return _.chain(this.items)
            .filter({selected: true})
            .map('model')
            .invokeMap('toJSON')
            .value();
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
