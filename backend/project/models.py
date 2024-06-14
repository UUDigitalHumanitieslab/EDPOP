from django.db import models
from django.contrib.auth.models import User, Group
from rdflib import URIRef
from django.conf import settings


class Project(models.Model):
    '''
    A project is a shared endeavour between a group of users (or a single user).

    Projects correspond to an RDF graph that contains related collections, annotations,
    etc. They represent a scope on which access can be managed.
    '''

    name = models.SlugField(
        max_length=256,
        blank=False,
        unique=True,
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
        help_text='User groups with write access to this project; all their members will '
            'gain access.',
    )


    def identifier(self) -> URIRef:
        '''
        Identifier of the project graph.
        '''
        return URIRef(settings.RDF_NAMESPACE_ROOT + 'project/' + self.name + '/')


    def permit_query_by(self, user: User) -> bool:
        '''
        Whether a user should be permitted to make (read-only) queries on the project
        graph.
        '''
        return self.public or user.is_superuser or self._granted_access(user)


    def permit_update_by(self, user: User) -> bool:
        '''
        Whether a user should be permitted to make update queries on the project graph.
        '''
        return user.is_superuser or self._granted_access(user)


    def _granted_access(self, user: User) -> bool:
        '''
        Whether a user has been given explicit access, either directly or through a group.
        '''
        return self.users.contains(user) or self.groups.filter(user=user).exists()
