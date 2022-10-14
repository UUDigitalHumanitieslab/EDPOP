from django.db import models
from django.contrib import admin
from django.contrib.auth.models import Group, User
from django.contrib.auth.decorators import user_passes_test
from django.contrib.postgres.fields import JSONField


class ResearchGroup(models.Model):
    """ Research group with a given name and project;
    Users can be part of multiple research groups,
    research groups have multiple users.
    """
    name = models.CharField(max_length=200)
    project = models.CharField(max_length=200)
    members = models.ManyToManyField(User, related_name='researchgroups')

    class Meta:
        permissions = (
            ("add_user_to_research_group", "Can add user to a research group"),
        )

    def __str__(self):
        return self.name


class Collection(models.Model):
    """ a collection of records imported from an external resource,
    which can be annotated and extended in the Virtual Research Environment.
    """
    description = models.CharField(max_length=200)
    managing_group = models.ManyToManyField(ResearchGroup)

    class Meta:
        permissions = (
            ("give_access_to_collection", "Can give access to a collection"),
        )

    def __str__(self):
        return self.description


class Record(models.Model):
    """ an item in one or several collections in the
    Virtual Research Environment.
    """
    uri = models.CharField(max_length=200, blank=True)
    collection = models.ManyToManyField(Collection)
    content = JSONField(dict)

    def __str__(self):
        return self.uri


class Annotation(models.Model):
    """ Import the fields of a given record, and stores annotations to its
    fields, as well as extra information.
    An annotation is related to exactly one record.
    One record can have multiple annotations.
    An annotation is also linked to exactly one research group,
    but multiple groups can add annotations."""
    record = models.ForeignKey(Record, on_delete=models.CASCADE)
    managing_group = models.ForeignKey(ResearchGroup, on_delete=models.CASCADE)
    content = JSONField(dict)

    def __str__(self):
        return '{} ({})'.format(self.record.uri, self.managing_group.name)
