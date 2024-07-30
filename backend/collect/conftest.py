import pytest
from django.contrib.auth.models import User
from projects.models import Project


@pytest.fixture()
def user(db) -> User:
    return User.objects.create(
        username='tester',
        password='secret'
    )

@pytest.fixture()
def project(db, user):
    project = Project.objects.create(
        name='test_project',
        display_name='Test project'
    )
    project.users.add(user)
    return project
