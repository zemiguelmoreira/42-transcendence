FROM nginx:1.25.5-bookworm
RUN apt-get update && \
	apt-get install -y iputils-ping netcat-openbsd telnet openssl
COPY ./default.conf /etc/nginx/conf.d/
COPY ./docker-entrypoint.sh /scripts/
RUN chmod +x /scripts/docker-entrypoint.sh
ENTRYPOINT ["/scripts/docker-entrypoint.sh"]
