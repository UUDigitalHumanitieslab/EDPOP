from rest_framework import serializers

from .models import Collection, Record


class CollectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Collection
        fields = ('id', 'description')


class RecordSerializer(serializers.ModelSerializer):
    collection = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = Record
        fields = ('id', 'uri', 'collection', 'content')
