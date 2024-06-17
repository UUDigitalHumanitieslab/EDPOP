from django.contrib import admin
from projects import models

@admin.register(models.Project)
class ProjectAdmin(admin.ModelAdmin):
    filter_horizontal = ['users', 'groups']

    def get_readonly_fields(self, request, obj):
        # make name readonly after creation to prevent breaking IRIs
        return ['name'] if obj else []
