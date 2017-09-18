from django.http import HttpResponse

# Create your views here.
def index(request):
    return HttpResponse("From this view it will be possible to query external resources, and import into collections.")