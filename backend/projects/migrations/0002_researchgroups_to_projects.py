# Generated by Django 4.2.13 on 2024-06-17 12:49

from django.db import migrations
from projects.migration_utils import name_to_slug
from projects.signals import store_project_graph, delete_project_graph

def research_groups_to_projects(apps, schema_editor):
    ResearchGroup = apps.get_model('vre', 'ResearchGroup')
    Project = apps.get_model('projects', 'Project')

    for research_group in ResearchGroup.objects.all():
        project = Project.objects.create(
            name=name_to_slug(research_group.name),
            display_name=research_group.name,
        )
        for user in research_group.members.all():
            project.users.add(user)
        project.save()

        # signals are not triggered by migrations; manually call function to save the
        # project in the triplestore
        store_project_graph(Project, project, True)


def projects_to_research_groups(apps, schema_editor):
    ResearchGroup = apps.get_model('vre', 'ResearchGroup')
    Project = apps.get_model('projects', 'Project')

    for project in Project.objects.all():
        research_group = ResearchGroup.objects.create(
            name=project.display_name,
        )

        for user in project.users.all():
            research_group.members.add(user)

        project.delete()
        delete_project_graph(Project, project)

class Migration(migrations.Migration):
    '''
    Migrate ResearchGroup data into Project table

    Projects are not exactly analogous to ResearchGroups (which is why a new model is
    used in the first place), but this migration provides the smoothest transition of
    existing data.

    Note: project names must be unique (to be used in URIs), while research groups need
    not be. This migration will fail if the database contains duplicate names. If that
    happens, manually edit the data before migrating.
    '''

    dependencies = [
        ('projects', '0001_initial'),
        ('vre', '0005_alter_annotation_content_alter_annotation_id_and_more')
    ]

    operations = [
        migrations.RunPython(
            research_groups_to_projects,
            reverse_code=projects_to_research_groups,
        )
    ]
