# Generated by Django 4.2.13 on 2024-06-14 09:49

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Project',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.SlugField(help_text="Name of the project; used in IRIs for the project's RDF data", max_length=256, unique=True)),
                ('public', models.BooleanField(default=False, help_text='If true, any visitors can read the RDF data in this project')),
                ('groups', models.ManyToManyField(help_text='User groups with write access to this project; all their members will gain access.', related_name='projects', to='auth.group')),
                ('users', models.ManyToManyField(help_text='Users who can write RDF data in this project', related_name='projects', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
