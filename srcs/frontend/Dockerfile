FROM nginx:1.25.5-bookworm
RUN apt-get update && \
	apt-get install -y iputils-ping netcat-openbsd telnet
COPY ./www/index.html /usr/share/nginx/html
COPY ./docker-entrypoint.sh /scripts/
COPY ./default.conf /etc/nginx/conf.d
RUN chmod +x /scripts/docker-entrypoint.sh
ENTRYPOINT ["/scripts/docker-entrypoint.sh"]
