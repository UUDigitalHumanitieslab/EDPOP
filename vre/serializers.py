from rest_framework import serializers

from .models import ResearchGroup, Collection, Record, Annotation


class ResearchGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResearchGroup
        fields = ('id', 'name', 'project')


class CollectionSerializer(serializers.ModelSerializer):
    managing_group = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = Collection
        fields = ('id', 'description', 'managing_group')


class RecordSerializer(serializers.ModelSerializer):
    collection = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = Record
        fields = ('id', 'uri', 'collection', 'content')


class AnnotationSerializer(serializers.ModelSerializer):
    record = serializers.PrimaryKeyRelatedField(read_only=True)
    managing_group = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Annotation
        fields = ('id', 'record', 'managing_group', 'content')
