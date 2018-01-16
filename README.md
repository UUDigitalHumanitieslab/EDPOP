# EDPOP
Creating a virtual research environment (VRE) from CERL resources. So far, this is a fairly vanilla Django application, with the only addition that there is a collection and record model in the application "VRE".

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
