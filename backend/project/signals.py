from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.conf import settings
from rdf.utils import prune_triples

from project.models import Project
from project.graphs import new_project_graph
from triplestore.utils import triples_to_quads, all_triples

@receiver(post_save, sender=Project)
def create_project_graph(sender, instance: Project, created, **kwargs):
    '''
    Create a new graph for a project
    '''
    if created:
        store = settings.RDFLIB_STORE
        g = new_project_graph(instance)
        triples = all_triples(g)
        quads = triples_to_quads(triples, instance.graph())
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