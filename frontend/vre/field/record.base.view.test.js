import assert from 'assert';
import { each, zip } from 'lodash';
import { Collection } from 'backbone';
import { FieldView }  from './field.view.js';
import { RecordFieldsBaseView }  from './record.base.view.js';

var testFields = [{
    key: 'Color',
    value: 'green',
}, {
    key: 'Texture',
    value: 'fluffy',
}, {
    key: 'Temper',
    value: 'cranky',
}, {
    key: 'Pet',
    value: 'worm',
}];

function assertRows() {
    var rows = this.view.rows;
    var trs = this.view.$('tr');
    assert(rows.length === this.collection.length);
    assert(trs.length === this.collection.length);
    var triplets = zip(this.collection.models, rows, trs);
    each(triplets, function([model, field, tr], index) {
        assert(field instanceof FieldView);
        assert(field.model === model);
        assert(field.el === tr);
    });
}

describe('RecordFieldsBaseView', function() {
    beforeEach(function() {
        this.collection = new Collection(testFields);
        assert(this.collection.length === testFields.length);
        this.view = new RecordFieldsBaseView({collection: this.collection});
        this.view.render();
    });

    afterEach(function() {
        this.view.remove();
    });

    it('creates and inserts a FieldView for each model', assertRows);

    it('keeps the rows up-to-date with new models', function() {
        this.collection.add({key: 'Habitat', value: 'trash can'});
        this.collection.add({key: 'Language', value: 'English'}, {at: 2});
        assertRows.call(this);
    });

    it('renders idempotently', function() {
        this.view.render();
        assertRows.call(this);
    });
});
