# Orbit Studio

The Orbit Studio landing page is served by Django.

## Run locally

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py runserver
```

Open http://127.0.0.1:8000/ in your browser. The Django administration site is
available at http://127.0.0.1:8000/admin/.

Create an administrator account before signing in:

```bash
python manage.py migrate
python manage.py createsuperuser
```

For deployment, set `DJANGO_SECRET_KEY` to a private random value, set
`DJANGO_DEBUG=false`, and set `DJANGO_ALLOWED_HOSTS` to the hostnames serving
the site. Keep these values and the local SQLite database out of Git.
