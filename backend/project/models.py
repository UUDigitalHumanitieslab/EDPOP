from django.db import models
from django.contrib.auth.models import User, Group

class Project(models.Model):
    '''
    A project is a shared endeavour between a group of users.

    Projects correspond to an RDF graph that contains related collections, annotations,
    etc. They represent a scope on which access can be managed.
    '''

    name = models.SlugField(
        max_length=256,
        blank=False,
        help_text='Name of the project; used in IRIs for the project\'s RDF data',
    )
    public = models.BooleanField(
        default=False,
        help_text='If true, any visitors can read the RDF data in this project',
    )
    users = models.ManyToManyField(
        to=User,
        related_name='projects',
        help_text='Users who can write RDF data in this project',
    )
    groups = models.ManyToManyField(
        to=Group,
        related_name='projects',
        help_text='User groups with write access to this project; all their members will gain access.',
    )