from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.conf import settings
from rdf.utils import prune_triples

from projects.models import Project
from projects.graphs import (
    stored_project_metadata, project_metadata_to_graph
)
from triplestore.utils import triples_to_quads, all_triples

@receiver(post_save, sender=Project)
def store_project_graph(sender, instance: Project, created, **kwargs):
    '''
    Store project metadata in the triplestore.
    '''
    store = settings.RDFLIB_STORE
    g = instance.graph()

    if not created:
        prune_triples(g, stored_project_metadata(instance))

    triples = all_triples(project_metadata_to_graph(instance))
    quads = triples_to_quads(triples, g)
    store.addN(quads)
    store.commit()


@receiver(post_delete, sender=Project)
def delete_project_graph(sender, instance, **kwargs):
    '''
    Delete all data in a project graph
    '''

    store = settings.RDFLIB_STORE
    g = instance.graph()
    prune_triples(g, all_triples(g))
    store.commit()
