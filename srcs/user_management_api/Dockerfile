FROM python:3.13.0b1-bookworm
RUN apt-get update && \
apt-get install -y iputils-ping netcat-openbsd telnet
WORKDIR /usr/src/app
RUN pip3 install --upgrade pip
RUN pip3 install psycopg2-binary
COPY ./requirements.txt /usr/src/app/requirements.txt
RUN pip3 install -r requirements.txt
COPY ./user_project /usr/src/app/
COPY ./docker-entrypoint.sh /scripts/
RUN chmod +x /scripts/docker-entrypoint.sh
ENTRYPOINT ["/scripts/docker-entrypoint.sh"]
