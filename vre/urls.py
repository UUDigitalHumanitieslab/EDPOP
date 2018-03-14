from django.conf.urls import url
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

from . import views

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^(?P<collection_id>[0-9]+)/$', views.collection_detail, name='collection_overview'),
    url(r'^(?P<collection_id>[0-9]+)/add-selection$', views.add_records_to_collection, name='collection_add_items'),
    url(r'^item_detail/(.+)$', views.item_detail, name='item_detail')
]

urlpatterns += staticfiles_urlpatterns()