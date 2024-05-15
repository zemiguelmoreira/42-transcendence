FROM python:3.13.0b1-bookworm
RUN apt-get update && \
	apt-get install -y iputils-ping netcat-openbsd telnet
RUN pip3 install django
COPY ./docker-entrypoint.sh /scripts/
RUN chmod +x /scripts/docker-entrypoint.sh
ENTRYPOINT ["/scripts/docker-entrypoint.sh"]
