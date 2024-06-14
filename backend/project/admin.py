from django.contrib import admin
from project import models

@admin.register(models.Project)
class ProjectAdmin(admin.ModelAdmin):
    pass