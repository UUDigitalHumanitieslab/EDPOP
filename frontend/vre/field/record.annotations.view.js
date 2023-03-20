import _ from 'lodash';
import Backbone from 'backbone';
import { AnnotationEditView } from '../annotation/annotation.edit.view';
import { GlobalVariables } from '../globals/variables';
import { RecordFieldsBaseView } from './record.base.view';

export var RecordAnnotationsView = RecordFieldsBaseView.extend({
    title: 'Annotations',

    initialize: function(options) {
        RecordFieldsBaseView.prototype.initialize.call(this, options);
        this.editable = true;  // enables "New field" button
    },

    events: {
        'click table + button': 'editEmpty',
    },

    edit: function(model) {
        var group = GlobalVariables.groupMenu.model.get('name'),
            editTarget = model.clone().set('group', group),
            preExisting = this.collection.get(editTarget),
            newRow;
        if (preExisting) {
            var index = this.collection.indexOf(preExisting),
                oldRow = this.items[index];
            newRow = new AnnotationEditView({
                model: preExisting,
                existing: true,
            });
            this.items.splice(index, 1, newRow);
            oldRow.remove();
        } else {
            newRow = new AnnotationEditView({model: editTarget});
            this.items.push(newRow);
        }
        this.placeItems();
        newRow.on(_.pick(this, ['save', 'cancel', 'trash']), this);
    },

    editEmpty: function() {
        this.edit(new Backbone.Model());
    },

    cancel: function(editRow) {
        var index = _.indexOf(this.items, editRow);
        editRow.remove();
        this.items.splice(index, 1);
        if (editRow.existing) {
            this.items.splice(index, 0, this.makeItem(editRow.model));
            this.placeItems();
        }
    },

    save: function(editRow) {
        var model = editRow.model;
        this.cancel(editRow);
        this.collection.add(model, {merge: true});
    },

    trash: function(editRow) {
        if (editRow.existing) {
            this.collection.remove(editRow.model);
        } else {
            this.cancel(editRow);
        }
    },
});