import { RecordFieldsBaseView } from './record.base.view';

export var RecordFieldsView = RecordFieldsBaseView.extend({
    title: 'Original content',
    edit: function(model) {
        this.trigger('edit', model);
    },
});
