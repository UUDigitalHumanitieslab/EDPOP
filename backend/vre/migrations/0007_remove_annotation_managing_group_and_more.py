# Generated by Django 4.2.13 on 2024-06-18 13:32

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('vre', '0006_annotation_context_collection_context'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='annotation',
            name='managing_group',
        ),
        migrations.RemoveField(
            model_name='collection',
            name='managing_group',
        ),
        migrations.DeleteModel(
            name='ResearchGroup',
        ),
    ]
