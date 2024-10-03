import _ from 'lodash';
import { View as BBView } from 'backbone';
import { getAltClickMixin } from '@uu-cdh/backbone-util';

/**
 * Common base class for all of our views.
 * Among other things, it enables alt-click debugging.
 * @class
 */
export var View = BBView.extend(_.extend(getAltClickMixin(), {
    constructor: function(options) {
        View.call(this, options);
        this.enableAltClick();
    },

    remove: function() {
        this.$el.off('click');
        return View.prototype.remove.call(this);
    },
}));
