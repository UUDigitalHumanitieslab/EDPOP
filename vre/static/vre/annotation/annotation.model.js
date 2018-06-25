//import { Backbone } from 'backbone';
import { APIModel, APICollection } from '../utils/api.model';
import { canonicalSort } from '../utils/generic-functions';

export var Annotations = APICollection.extend({
    url: '/vre/api/annotations',
});

export var FlatAnnotations = Backbone.Collection.extend({
    // comparator: can be set to keep this sorted
    // How to uniquely identify a field annotation.
    comparator: function(item) {
        return canonicalSort(item.attributes.key);
    },
    modelId: function(attributes) {
        return attributes.key + ':' + attributes.group;
    },
    initialize: function(models, options) {
        _.assign(this, _.pick(options, ['record']));
        this.underlying = this.record.getAnnotations();
        this.underlying.forEach(this.toFlat.bind(this));
        this.markedGroups = new Backbone.Collection([]);
        this.listenTo(this.underlying, 'add change:content', this.toFlat);
        this.on('add change:value', this.markGroup);
        this.markedGroups.on('add', _.debounce(this.fromFlat), this);
        // this.listenTo(this.underlying, 'remove', TODO);
        // this.on('remove', TODO);
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
            groupId = annotation.get('managing_group'),
            groupName = allGroups.get(groupId).get('name'),
            content = annotation.get('content'),
            existing = _.map(this.filter({group: groupName}), 'attributes'),
            replacements = _.map(content, function(value, key) {
                return {id: id, key: key, value: value, group: groupName};
            }),
            obsolete = _.differenceBy(existing, replacements, this.modelId);
        // After the next two lines, this.models will be up-to-date and
        // appropriate events will have been triggered.
        this.remove(obsolete);
        this.add(replacements, {merge: true});
    },
    markGroup: function(flatAnnotation) {
        this.markedGroups.add({id: flatAnnotation.get('group')});
    },
    // translate the flat representation to the official one, save immediately
    fromFlat: function() {
        var flat = this,
            record = flat.record,
            recordId = record.id,
            flatPerGroup = flat.groupBy('group');
        var newContent = flat.markedGroups.map('id').map(function(groupName) {
            var groupId = allGroups.findWhere({name: groupName}).id,
                existing = flat.underlying.findWhere({managing_group: groupId}),
                id = existing && existing.id,
                content = _(flatPerGroup[groupName]).map(function(model) {
                    return [model.get('key'), model.get('value')];
                }).fromPairs().value();
            return {
                id: id,
                record: recordId,
                managing_group: groupId,
                content: content,
            };
        });
        // At least one annotation exists, so now is the time to ensure
        // the VRE knows the record.
        if (record.isNew()) record.save().then(function() {
            _.invokeMap(flat.underlying.models, 'set', 'record', record.id);
        });
        flat.underlying.add(newContent, {merge: true});
        flat.markedGroups.reset();
    },
});