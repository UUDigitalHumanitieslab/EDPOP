from django.conf.urls import url, include
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

from rest_framework import routers

from . import views, api

api_router = routers.DefaultRouter()
api_router.register(r'researchgroups', api.ResearchGroupViewSet)
api_router.register(r'collections', api.CollectionViewSet)
api_router.register(r'records', api.RecordViewSet)
api_router.register(r'annotations', api.AnnotationViewSet)
api_router.register(r'search', api.SearchViewSet, base_name='search')
api_router.register(r'add-selection', api.AddRecordsViewSet, base_name='add-selection')

urlpatterns = [
    url(r'^api/', include(api_router.urls)),
    url(r'^api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    url(r'^$', views.index, name='index'),
    url(r'^(?P<database_id>[a-zA-Z0-9]+)/$', views.index, name='index'),
]

urlpatterns += staticfiles_urlpatterns()
