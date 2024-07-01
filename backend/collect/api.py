from rest_framework.viewsets import ViewSet
from rest_framework.response import Response

class CollectionViewSet(ViewSet):
    '''
    Viewset for listing or retrieving collections
    '''

    def list(self, request):
        return Response([])