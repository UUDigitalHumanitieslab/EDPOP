from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group, User

from .models import Collection, ResearchGroup


class ResearchGroupAdmin(admin.ModelAdmin):
    filter_horizontal = ('members',)


class CollectionAdmin(admin.ModelAdmin):
	filter_horizontal = ('managing_group',)


admin.site.register(Collection, CollectionAdmin)
admin.site.register(ResearchGroup, ResearchGroupAdmin)