from django.contrib import admin

# Register your models here.
from .models import Collection

#class GroupAdmin(admin.modelAdmin):


admin.site.register(Collection)