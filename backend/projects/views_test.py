from django.test import Client
from django.contrib.auth.models import User
import pytest

from projects.models import Project

@pytest.fixture()
def user(db):
    return User.objects.create(
        username='tester',
        password='secret'
    )

@pytest.fixture()
def public_project(db):
    return Project.objects.create(
        name='public',
        display_name='Public',
        public=True,
    )

@pytest.fixture()
def private_project(db, user):
    project = Project.objects.create(
        name='private',
        display_name='Private',
    )
    project.users.add(user)
    project.save()
    return project

def test_project_list_view_anonymous(db, public_project, private_project, client: Client):
    response = client.get('/api/projects/')
    assert response.status_code == 200
    assert len(response.data) == 1

def test_project_list_view_authenticated(db, public_project, private_project, user, client: Client):
    client.force_login(user)
    response = client.get('/api/projects/')
    assert response.status_code == 200
    assert len(response.data) == 2
