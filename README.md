# EDPOP
Creating a virtual research environment (VRE) from CERL resources. So far, this is a fairly vanilla Django application, with the only addition that there is a collection and record model in the application "VRE".

## Installing
Switch to a virtual environment with Python 3.5 installed. Run `pip install -r requirements.txt`.

## Running
Run `python manage.py createsuperuser`, provide an admin name, email and password. Then, run `python manage.py runserver`. Now the Django app should run on `localhost:8000`, and the admin should be available with the credentials provided. If migrations need to be applied, run `python manage.py migrate`.
