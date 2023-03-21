# EDPOP

Creating a virtual research environment (VRE) from CERL resources.

The VRE consists of separate backend and frontend applications. They are documented in more detail in their respective directories. To run them jointly during development, take the following steps:

1. Make sure you have taken all preparation steps in the READMEs of both applications.
2. Open a new terminal in the `frontend` directory and run `npm run watch`.
3. Open a new terminal in the `backend` directory and run `python manage.py runserver`.
4. Open `localhost:8000`.
5. Manually refresh the browser to see code changes reflected.

Tests of both applications can be run at any time, independently from each other.
