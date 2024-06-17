from django.contrib import admin
from project import models

@admin.register(models.Project)
class ProjectAdmin(admin.ModelAdmin):
    def get_readonly_fields(self, request, obj):
        # make name readonly after creation to prevent breaking IRIs
        return ['name'] if obj else []
