# Generated by Django 4.2.13 on 2024-07-02 13:13

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0004_fill_project_uri'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='uri',
            field=models.CharField(help_text='URI for the project in RDF data', max_length=256, unique=True),
        ),
    ]
