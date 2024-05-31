FROM python:3.13.0b1-bookworm
RUN apt-get update
WORKDIR /usr/src/app
RUN pip3 install --upgrade pip
RUN pip3 install psycopg
COPY ./requirements.txt /usr/src/app/requirements.txt
RUN pip3 install -r requirements.txt
COPY ./pong /usr/src/app/
COPY ./docker-entrypoint.sh /scripts/
RUN chmod +x /scripts/docker-entrypoint.sh
ENTRYPOINT ["/scripts/docker-entrypoint.sh"]
