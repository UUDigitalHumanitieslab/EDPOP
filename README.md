# EDPOP
Creating a virtual research environment (VRE) from CERL resources.

## Database
The project uses PostgreSQL, to make use of JSON fields (the format in which resources from external databases will be imported, and annotated).

A guide for setting up PostgreSQL in Django can be found here:
[][https://www.digitalocean.com/community/tutorials/how-to-use-postgresql-with-your-django-application-on-ubuntu-14-04]

## Installing
Switch to a virtual environment with Python 3.5+ installed, then:

```bash
pip install -r requirements.txt
python manage.py migrate # create the database
python manage.py createsuperuser # ask to specify a new admin name, email and password
```

## Running

```bash
python manage.py runserver
```

The Django server will run on `localhost:8000`, and the admin should be available with the credentials provided during installation.

## Frontend
Install the dependencies of the frontend via npm install.
```bash
npm install
```

Then, use browserify to package the modules into a bundle, and convert from ES6 to ES5 JavaScript with babelify. Watchify will watch for any changes and reconvert if needed:
```bash
npx watchify vre/static/vre/main.js -o vre/static/vre/bundle.js -t babelify -t [browserify-shim --global]
```

## Gulpfile
This is work in progress and doesn't work yet. Therefore the dependencies in this file have been removed from package.json for now. Eventually, the gulpfile might run more tasks, such as uglify and source maps.

