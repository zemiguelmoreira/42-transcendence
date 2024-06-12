#!/bin/bash
python manage.py makemigrations
python manage.py migrate
if [ "$DJANGO_SUPERUSER_USERNAME" ]
then
    python manage.py createsuperuser \
        --noinput \
        --username $DJANGO_SUPERUSER_USERNAME \
        --email $DJANGO_SUPERUSER_EMAIL
fi
# python manage.py runserver 0.0.0.0:8000
gunicorn --workers 2 --bind 0.0.0.0:8000 pong.wsgi:application
daphne -p 8001 pong.asgi:application
