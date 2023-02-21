from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group, User
from django.contrib.postgres import fields

from django_json_widget.widgets import JSONEditorWidget

from .models import Collection, ResearchGroup, Record, Annotation


class ResearchGroupAdmin(admin.ModelAdmin):
    filter_horizontal = ('members',)


class CollectionAdmin(admin.ModelAdmin):
    filter_horizontal = ('managing_group',)


class RecordAdmin(admin.ModelAdmin):
    formfield_overrides = {
        fields.JSONField: {'widget': JSONEditorWidget},
    }


class AnnotationAdmin(admin.ModelAdmin):
    pass


admin.site.register(Collection, CollectionAdmin)
admin.site.register(ResearchGroup, ResearchGroupAdmin)
admin.site.register(Record, RecordAdmin)
admin.site.register(Annotation, AnnotationAdmin)