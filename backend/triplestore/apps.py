import os

from django.apps import AppConfig
from django.core.checks import register, Tags, Error, Info
from django.conf import settings

from triplestore.blazegraph import probe_blazegraph_connection, test_namespace_available, NamespaceStatus


def probe_blazegraph(app_configs, **kwargs) -> list:
    errors = []
    bg = probe_blazegraph_connection()
    if bg is True:
        # Connection works; check namespace
        ns = test_namespace_available()
        namespace_name = settings.TRIPLESTORE_NAMESPACE
        if ns == NamespaceStatus.NO_QUADS:
            errors.append(Error(f"Namespace {namespace_name} exists but it does not support quads. Please recreate it in quads mode."))
        elif ns == NamespaceStatus.ABSENT:
            errors.append(Error(f"Namespace {namespace_name} does not exist. Please create it using the Blazegraph web interface."))
    else:
        errors.append(Error(f"Cannot connect to Blazegraph on {settings.TRIPLESTORE_BASE_URL}"))
    return errors


class TriplestoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'triplestore'

    def ready(self) -> None:
        register(probe_blazegraph)

