import { RecordFieldsBaseView } from './record.base.view';

export var RecordFieldsView = RecordFieldsBaseView.extend({
    title: 'Normalized content',
    edit: function(model) {
        this.trigger('edit', model);
    },
});
