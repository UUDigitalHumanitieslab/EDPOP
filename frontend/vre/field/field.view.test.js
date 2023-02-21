import assert from 'assert';
import sinon from 'sinon';
import { each } from 'lodash';
import { Model } from 'backbone';
import { FieldView } from './field.view';

describe('FieldView', function() {
    beforeEach(function() {
        this.model = new Model({
            key: 'Color',
            value: 'green',
            group: 'me, myself and I',
        });
        this.view = new FieldView({model: this.model});
    });

    afterEach(function() {
        this.view.remove();
    });

    it('renders with the contents of its model', function() {
        var text = this.view.$el.text();
        each(this.model.toJSON(), function(attributeValue) {
            assert(text.includes(attributeValue));
        });
    });

    it('updates when the value attribute changes', function() {
        var oldText = this.view.$el.text();
        var oldValue = this.model.get('value');
        var newValue = 'red';
        this.model.set('value', newValue);
        var newText = this.view.$el.text();
        assert(newText !== oldText);
        assert(!oldText.includes(newValue));
        assert(newText.includes(newValue));
        assert(!newText.includes(oldValue));
    });

    it('triggers an edit event when clicked', function() {
        var detectEdit = sinon.fake();
        this.view.on('edit', detectEdit).$el.click();
        assert(detectEdit.called);
    });
});
