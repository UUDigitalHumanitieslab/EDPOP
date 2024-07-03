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

class CollectionSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=128)
    summary = serializers.CharField(
        max_length=1024, required=False, allow_null=True, default=None
    )
    project = ProjectField()
    uri = serializers.URLField(read_only=True)

    def create(self, validated_data):
        project_uri = validated_data['project']
        project = Project.objects.get(uri=str(project_uri))
        graph = project.graph()
        uri = collection_uri(validated_data['name'])
        collection = EDPOPCollection(graph, uri)
        collection.name = validated_data['name']
        collection.summary = validated_data['summary']
        collection.project = URIRef(project_uri)
        collection.save()
        return collection

    def update(self, instance: EDPOPCollection, validated_data):
        instance.name = validated_data['name']
        instance.summary = validated_data['summary']
        instance.project = validated_data['project']
        instance.save()
        return instance
