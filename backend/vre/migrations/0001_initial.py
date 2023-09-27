# -*- coding: utf-8 -*-
# Generated by Django 1.11.2 on 2017-10-11 07:45
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Collection',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('description', models.CharField(max_length=200)),
            ],
            options={
                'permissions': (('give_access_to_collection', 'Can give access to a collection'),),
            },
        ),
        migrations.CreateModel(
            name='Record',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('uri', models.CharField(max_length=200)),
                ('collection', models.ManyToManyField(to='vre.Collection')),
            ],
        ),
        migrations.CreateModel(
            name='ResearchGroup',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('project', models.CharField(max_length=200)),
                ('members', models.ManyToManyField(related_name='researchgroup', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'permissions': (('add_user_to_research_group', 'Can add user to a research group'),),
            },
        ),
        migrations.AddField(
            model_name='collection',
            name='managing_group',
            field=models.ManyToManyField(to='vre.ResearchGroup'),
        ),
    ]