from rest_framework import serializers

from .models import ResearchGroup, Collection, Record, Annotation


class OwnGroupsPrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    """ Customized field that gets the queryset dynamically. """
    def get_queryset(self):
        return self.context['request'].user.researchgroups.all()


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
    record = serializers.PrimaryKeyRelatedField(queryset=Record.objects.all())
    managing_group = OwnGroupsPrimaryKeyRelatedField()

    class Meta:
        model = Annotation
        fields = ('id', 'record', 'managing_group', 'content')
