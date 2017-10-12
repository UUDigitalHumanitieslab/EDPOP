from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^(?P<collection_id>[0-9]+)/$', views.collection_detail, name='collection_detail'),
]