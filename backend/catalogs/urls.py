from django.urls import path

from . import api

urlpatterns = [
    path('search/', api.SearchView.as_view()),
    path('catalogs/', api.CatalogsView.as_view()),
]
