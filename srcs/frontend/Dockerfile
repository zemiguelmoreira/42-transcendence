FROM nginx:1.25.5-bookworm
RUN apt-get update && \
apt-get install -y netcat-openbsd telnet vim
COPY ./index.html /usr/share/nginx/html
COPY ./docker-entrypoint.sh /scripts/
RUN chmod +x /scripts/docker-entrypoint.sh
ENTRYPOINT ["/scripts/docker-entrypoint.sh"]
