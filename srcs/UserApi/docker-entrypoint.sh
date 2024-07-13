#!/bin/bash
python manage.py makemigrations
# python manage.py migrate

#alteracoes significativas
python manage.py migrate --fake-initial


if [ "$DJANGO_SUPERUSER_USERNAME" ]
then
    python manage.py createsuperuser \
        --noinput \
        --username $DJANGO_SUPERUSER_USERNAME \
        --email $DJANGO_SUPERUSER_EMAIL
fi
# gunicorn --workers 2 --bind 0.0.0.0:8000 UserApi.wsgi:application
daphne -b 0.0.0.0 -p 8000 UserApi.asgi:application
# daphne -u /run/daphne/daphne.sock --fd 0 --access-log - --proxy-headers UserApi.asgi:application