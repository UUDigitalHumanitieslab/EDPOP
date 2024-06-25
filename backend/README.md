# EDPOP: backend

## Relational database

The project uses [PostgreSQL](https://www.postgresql.org/).

For local development, you need to create a database and database user with the names and password mentioned in `edpop/settings.py`. See the `NAME`, `USER` and `PASSWORD` entries of the `DATABASES['default']`.

For testing in local development (**only!**), the database user needs to have the `CREATEDB` privilege:

```sql
ALTER USER edpopuser CREATEDB;
```

## Triplestore

The development settings included with this application assume that you have a Blazegraph server running on port 9999 (the default) and the namespace `edpop` is created. The following steps suffice to make this true.

Follow the [Blazegraph quick start guide](https://github.com/blazegraph/database/wiki/Quick_Start) to download and start the database server and a foreground process.
While the server is running, you can access its web interface at http://localhost:9999. This lets you upload and download data, try out queries and review statistics about the dataset. The server can be stopped by typing `ctrl-c`.

### Setting up Blazegraph namespaces

Visit the [web interface]( http://localhost:9999), navigate to the `NAMESPACES` tab. Use the `create namespace` form to create a new namespace. Choose `edpop` as a name, and set the mode to `quads`. All other checkboxes should be disabled. A popup is shown with additional settings. Leave these at their default values and choose `Create`. The created namespace should now appear in the list of namespaces. Choose `use` to use the readit namespace when operating the web interface

In order to support the unittests, visit the Blazegraph web interface and create an additional namespace by the name `edpop_testing`.

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
