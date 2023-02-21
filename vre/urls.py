from django.urls import path, include
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

from rest_framework import routers

from . import views, api

api_router = routers.DefaultRouter()
api_router.register(r'researchgroups', api.ResearchGroupViewSet)
api_router.register(r'collections', api.CollectionViewSet)
api_router.register(r'records', api.RecordViewSet)
api_router.register(r'annotations', api.AnnotationViewSet)
api_router.register(r'search', api.SearchViewSet, basename='search')
api_router.register(r'add-selection',
                    api.AddRecordsViewSet,
                    basename='add-selection')

urlpatterns = [
    path('api/', include(api_router.urls)),
    path('api-auth/',
         include('rest_framework.urls', namespace='rest_framework')),
    path('', views.index, name='index'),
    path('<slug:id>/', views.index, name='index'),
]

urlpatterns += staticfiles_urlpatterns()
