import { LazyTemplateView } from '../utils/lazy.template.view';

export var AdvancedSearchView = LazyTemplateView.extend({
    templateName: 'hpb-search-info',
    events: {
        'click a': 'fill',
    },
    render: function() {
        $('#search-info').show();
        $('#search-info').popover({
            'html': true,
            'content': this.$el.html(this.template()),
            'container': 'body',
            'placement': 'left'
        });
    },
    fill: function(event) {
        event.preventDefault();
        var fillIn = event.target.textContent.slice(0, -9);
        this.trigger('fill', fillIn);
    },
});