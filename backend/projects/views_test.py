from django.test import Client

def test_project_list_view(db, client: Client):
    response = client.get('/api/projects/')
    assert response.status_code == 200