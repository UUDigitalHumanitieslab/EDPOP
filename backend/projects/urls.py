from django.urls import path

from projects import api

urlpatterns = [
    path('api/projects/', api.ProjectView.as_view({'get': 'list'})),
]
