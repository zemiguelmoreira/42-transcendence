FROM nginx:1.25.5-bookworm
RUN apt-get update && \
	apt-get install -y iputils-ping netcat-openbsd telnet
COPY ./index.html /usr/share/nginx/html
COPY ./js /usr/share/nginx/html
COPY ./css /usr/share/nginx/html
COPY ./docker-entrypoint.sh /scripts/
RUN chmod +x /scripts/docker-entrypoint.sh
ENTRYPOINT ["/scripts/docker-entrypoint.sh"]
