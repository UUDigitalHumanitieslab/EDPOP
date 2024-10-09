import  Backbone from 'backbone';
import { APIModel, APICollection } from '../utils/api.model';
import { canonicalSort } from '../utils/generic-functions';
import { vreChannel } from '../radio.js';

export var Annotations = APICollection.extend({
    url: '/api/annotations',
});

export var FlatAnnotations = APICollection.extend({
    comparator: function(item) {
        return canonicalSort(item.attributes.key);
    },
    // How to uniquely identify a field annotation.
    modelId: function(attributes) {
        return attributes.key + ':' + attributes.context;
    },
    initialize: function(models, options) {
        _.assign(this, _.pick(options, ['record']));
        this.underlying = this.record.getAnnotations();
        this.underlying.forEach(this.toFlat.bind(this));
        this.markedProjects = new Backbone.Collection([]);
        this.listenTo(this.underlying, 'add change:content', this.toFlat);
        this.on('add change:value remove', this.markProject);
        this.markedProjects.on('add', _.debounce(this.fromFlat), this);
        // this.listenTo(this.underlying, 'remove', TODO);
    },
    // translate the official representation to the flat one
    toFlat: function(annotation) {
        if (annotation.isNew() || annotation.hasChanged()) {
            // Store the annotation either immediately or on record save.
            if (this.record.isNew()) {
                this.listenToOnce(annotation, 'change:record', function() {
                    annotation.save(null, {silent: true});
                });
            } else annotation.save(null, {silent: true});
        }
        var id = annotation.id,
            projectId = annotation.get('context'),
            projectName = vreChannel.request('projects:get', projectId).get('name'),
            content = annotation.get('content'),
            existing = _.map(this.filter({ context: projectName }), 'attributes'),
            replacements = _.map(content, function(value, key) {
                return { id: id, key: key, value: value, context: projectName };
            }),
            obsolete = _.differenceBy(existing, replacements, this.modelId);
        // After the next two lines, this.models will be up-to-date and
        // appropriate events will have been triggered.
        this.remove(obsolete);
        this.add(replacements, {merge: true});
    },
    markProject: function (flatAnnotation) {
        this.markedProjects.add({ id: flatAnnotation.get('context') });
    },
    // translate the flat representation to the official one, save immediately
    fromFlat: function() {
        var flat = this,
            record = flat.record,
            recordId = record.id,
            flatPerProject = flat.groupBy('context');
        var newContent = flat.markedProjects.map('id').map(function (projectName) {
            var projectId = vreChannel.request('projects:find', { name: projectName }).id,
                existing = flat.underlying.findWhere({ context: projectId }),
                id = existing && existing.id,
                annotations = flatPerProject[projectName],
                content = annotations && _(annotations).map(function(model) {
                    return [model.get('key'), model.get('value')];
                }).fromPairs().value() || {};
            return {
                id: id,
                record: recordId,
                context: projectId,
                content: content,
            };
        });
        // At least one annotation exists, so now is the time to ensure
        // the VRE knows the record.
        if (record.isNew()) record.save().then(function() {
            _.invokeMap(flat.underlying.models, 'set', 'record', record.id);
        });
        flat.underlying.add(newContent, {merge: true});
        flat.markedProjects.reset();
    },
});
