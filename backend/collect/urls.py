from django.urls import path, include

from rest_framework import routers

from collect import api

api_router = routers.SimpleRouter(use_regex_path=True)
api_router.register(r'collections', api.CollectionViewSet, basename='collections')

urlpatterns = [
    path('', include(api_router.urls)),
]
