from django.conf.urls import url, include
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

from rest_framework import routers

from . import views, api

api_router = routers.DefaultRouter()
api_router.register(r'collections', api.CollectionViewSet, base_name='collection')
api_router.register(r'records', api.RecordViewSet)
api_router.register(r'search', api.HPBViewSet, base_name='search')

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^(?P<collection_id>[0-9]+)/$', views.collection_detail, name='collection_overview'),
    url(r'^(?P<collection_id>[0-9]+)/add-selection$', views.add_records_to_collections, name='collection_add_items'),
    url(r'^item_detail/(.+)$', views.item_detail, name='item_detail'),
    url(r'^api/', include(api_router.urls)),
    url(r'^api-auth/', include('rest_framework.urls', namespace='rest_framework')),
]

urlpatterns += staticfiles_urlpatterns()
