# EDPOP: backend

## Database

The project uses PostgreSQL, to make use of JSON fields (the format in which resources from external databases will be imported, and annotated).

A guide for setting up PostgreSQL in Django can be found here:
[][https://www.digitalocean.com/community/tutorials/how-to-use-postgresql-with-your-django-application-on-ubuntu-14-04]

For local development, you need to create a database and database user with the names and password mentioned in `edpop/settings.py`. See the `NAME`, `USER` and `PASSWORD` entries of the `DATABASES['default']`.

For testing in local development (**only!**), the database user needs to have the `CREATEDB` privilege:

```sql
ALTER USER edpopuser CREATEDB;
```

## Installing

Switch to a virtual environment with Python >= 3.9 installed, then:

```bash
pip install pip-tools
pip-sync requirements*.txt
python manage.py migrate # create the database
python manage.py createsuperuser # ask to specify a new admin name, email and password
```

If you need to update the requirements, edit the `requirements.in` (for application dependencies) or `requirements-test.in` (for test dependencies), then run `pip-compile requirements.in` and/or `pip-compile requirements-test.in` in order to update the corresponding `requirements{,-test}.txt`. This ensures that all pinned dependencies are compatible and that no dependencies linger around when they are no longer required.

## Running

```bash
python manage.py runserver
```

The Django server will run on `localhost:8000`, and the admin should be available with the credentials provided during installation.

Run the backend tests by invoking `pytest`.
