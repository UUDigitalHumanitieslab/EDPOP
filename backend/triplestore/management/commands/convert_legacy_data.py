from django.core.management import BaseCommand
from rdflib import Graph

from triplestore.convert_legacy_data.conversion import convert_all
from vre.models import Annotation, User, Collection, Record, ResearchGroup


class Command(BaseCommand):
    def handle(self, **options):
        annotations = Annotation.objects.all()
        users = User.objects.all()
        collections = Collection.objects.all()
        records = Record.objects.all()
        researchgroups = ResearchGroup.objects.all()
        uris, graph = convert_all(
            users, researchgroups, collections, records, annotations
        )
        assert isinstance(graph, Graph)
        print(graph.serialize())
