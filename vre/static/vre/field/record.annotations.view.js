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
                oldRow = this.rows[index];
            newRow = new AnnotationEditView({
                model: preExisting,
                existing: true,
            });
            this.rows.splice(index, 1, newRow);
            oldRow.$el.before(newRow.render().el);
            oldRow.remove();
        } else {
            newRow = new AnnotationEditView({model: editTarget});
            this.rows.push(newRow);
            this.$tbody.append(newRow.render().el);
        }
        newRow.on(_.pick(this, ['save', 'cancel', 'trash']), this);
    },
    editEmpty: function() {
        this.edit(new Backbone.Model());
    },
    cancel: function(editRow) {
        var staticRow, index = _.indexOf(this.rows, editRow);
        if (editRow.existing) {
            staticRow = this.createRow(editRow.model);
            editRow.$el.after(staticRow.render().el);
        }
        editRow.remove();
        this.rows.splice(index, 1, staticRow);
    },
    save: function(editRow) {
        var model = editRow.model;
        // first, remove the inline form
        this.rows.splice(_.indexOf(this.rows, editRow), 1);
        editRow.remove();
        // then, add the model
        if (editRow.existing) {
            // re-insert if pre-existing, because .add (below) will not trigger
            this.insertRow(model);
        }
        this.collection.add(model, {merge: true});
    },
    trash: function(editRow) {
        if (editRow.existing) this.collection.remove(editRow.model);
        this.rows.splice(_.indexOf(this.rows, editRow), 1);
        editRow.remove();
    },
});