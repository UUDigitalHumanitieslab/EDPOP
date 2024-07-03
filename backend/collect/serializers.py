from rest_framework import serializers
from rdflib import URIRef

from collect.rdf_models import EDPOPCollection
from collect.utils import collection_uri
from projects.models import Project

class CollectionSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=128)
    summary = serializers.CharField(max_length=1024, required=False, default=None)
    project = serializers.SlugField(max_length=64)
    uri = serializers.URLField(read_only=True)

    def create(self, validated_data):
        project = Project.objects.get(name=validated_data['project'])
        graph = project.graph()
        uri = collection_uri(validated_data['name'])
        collection = EDPOPCollection(graph, uri)
        collection.name = validated_data['name']
        collection.summary = validated_data['summary']
        collection.project = URIRef(project.uri)
        collection.save()
        return collection

    def update(self, instance: EDPOPCollection, validated_data):
        instance.name = validated_data['name']
        instance.summary = validated_data['summary']
        project = Project.objects.get(name=validated_data['project'])
        instance.project = URIRef(project.uri)
        instance.save()
        return instance
