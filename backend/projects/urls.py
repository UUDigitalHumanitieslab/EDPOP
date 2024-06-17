from django.urls import path

from projects import views

urlpatterns = [
    path('api/projects/', views.ProjectView.as_view({'get': 'list'})),
]
