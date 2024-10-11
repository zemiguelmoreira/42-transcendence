#!/bin/bash
python manage.py makemigrations
python manage.py migrate

# if [ "$DJANGO_SUPERUSER_USERNAME" ]
# then
#     python manage.py createsuperuser \
#         --noinput \
#         --username $DJANGO_SUPERUSER_USERNAME \
#         --email $DJANGO_SUPERUSER_EMAIL
# fi

# daphne -b 0.0.0.0 -p 8001 GameServer.asgi:application
python manage.py runserver 0.0.0.0:8001
