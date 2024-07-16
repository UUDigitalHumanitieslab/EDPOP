from rest_framework import serializers
from rdflib import URIRef

from collect.rdf_models import EDPOPCollection
from collect.utils import collection_uri
from projects.models import Project

class ProjectField(serializers.Field):
    def __init__(self, **kwargs):
        super().__init__( **kwargs)

    def to_internal_value(self, data):
        project = Project.objects.get(name=data)
        return URIRef(project.uri)
    
    def to_representation(self, value):
        project = Project.objects.get(uri=str(value))
        return project.name


def can_update_project(data):
    '''
    Validates that the specified project is one the user is allowed to write to.

    Note: while CollectionPermission checks whether the user has access to a collection
    its current context, this validator checks the user-submitted data. This is relevant
    when the user is creating or moving a collection.
    '''

    project_uri = data['project']
    user = data['user']

    project_obj = Project.objects.get(uri=str(project_uri))
    if not project_obj.permit_update_by(user):
        raise serializers.ValidationError(
            'No permission to write to this project'
        )


class CollectionSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=128)
    summary = serializers.CharField(
        max_length=1024, required=False, allow_null=True, default=None
    )
    project = ProjectField()
    uri = serializers.URLField(read_only=True)
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        validators = [can_update_project]

    def create(self, validated_data):
        project_uri = validated_data['project']
        project = Project.objects.get(uri=str(project_uri))
        graph = project.graph()
        uri = collection_uri(validated_data['name'])
        collection = EDPOPCollection(graph, uri)
        collection.name = validated_data['name']
        collection.summary = validated_data['summary']
        collection.project = project_uri
        collection.save()
        return collection

    def update(self, instance: EDPOPCollection, validated_data):
        instance.name = validated_data['name']
        instance.summary = validated_data['summary']
        instance.project = validated_data['project']
        instance.save()
        return instance
