import _ from 'lodash';
import { LazyTemplateView } from '../utils/lazy.template.view';
import { FieldView } from './field.view';

// Allow prototype property access in the Handlebars runtime (needed as of 4.6).
// This setting should be safe because it doesn't allow `.constructor`.
// See also https://mahmoudsec.blogspot.com/2019/04/handlebars-template-injection-and-rce.html.
var templateOptions = {
    allowProtoPropertiesByDefault: true,
};

export var RecordFieldsBaseView = LazyTemplateView.extend({
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
        this.$el.html(this.template(this, templateOptions));
        this.$tbody = this.$('tbody');
        this.$tbody.append(_(this.rows).invokeMap('render').map('el').value());
        return this;
    },
});
