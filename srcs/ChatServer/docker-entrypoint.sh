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

daphne -p 8000 ChatServer.asgi:application
