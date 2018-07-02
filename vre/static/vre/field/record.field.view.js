import  Backbone from 'backbone';
import { LazyTemplateView } from '../utils/lazy.template.view';
import { FieldView } from './field.view';
import { AnnotationEditView } from '../annotation/annotation.edit.view';
import { GlobalVariables } from '../globals/variables';

var RecordFieldsBaseView = LazyTemplateView.extend({
    templateName: 'field-list',
    initialize: function(options) {
        this.rows = this.collection.map(this.createRow.bind(this));
        this.listenTo(this.collection, 'add', this.insertRow);
    },
    createRow: function(model) {
        var row = new FieldView({model: model});
        row.on('edit', this.edit, this);
        return row;
    },
    insertRow: function(model) {
        var row = this.createRow(model),
            rows = this.rows,
            el = row.render().el,
            index = this.collection.indexOf(model);
        if (index >= rows.length) {
            rows.push(row);
            this.$tbody.append(el);
        } else {
            rows.splice(index, 0, row);
            this.$tbody.children().eq(index).before(el);
        }
    },
    render: function() {
        this.$el.html(this.template(this));
        this.$tbody = this.$('tbody');
        this.$tbody.append(_(this.rows).invokeMap('render').map('el').value());
        return this;
    },
});

export var RecordFieldsView = RecordFieldsBaseView.extend({
    title: 'Original content',
    edit: function(model) {
        this.trigger('edit', model);
    },
});

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
        newRow.on({cancel: this.cancel, save: this.save}, this);
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
});