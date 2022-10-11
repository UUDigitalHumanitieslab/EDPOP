import Backbone from 'backbone';
import { JST } from '../globals/templates';

/**
 * Intermediate class to enable lazy loading of templates.
 * `JST` is uninitialized at the time of extension, so postpone fetching
 * the template until it's needed.
 */
export var LazyTemplateView = Backbone.View.extend({
    template: function(context, options) {
        this.template = JST[this.templateName];
        return this.template(context, options);
    },
});
