from django.urls import path, include

from rest_framework import routers

from . import api

urlpatterns = [
    path('search/', api.SearchView.as_view()),
]
