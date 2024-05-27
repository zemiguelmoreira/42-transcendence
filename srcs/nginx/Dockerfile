FROM nginx:1.25.5-bookworm
RUN apt-get update && \
apt-get install -y openssl netcat-openbsd vim
# COPY ./conf/default.conf /etc/nginx/conf.d/
RUN mkdir -p /etc/nginx/ssl && \
openssl req -x509 -nodes -days 365 -new -keyout /etc/nginx/ssl/transcendence.key -out /etc/nginx/ssl/transcendence.crt -subj "/CN=transcendence/O=42/OU=42Porto/C=PT/ST=Porto/L=Porto/emailAddress=transcendence@42.pt"
# COPY ./docker-entrypoint.sh /scripts/
# RUN chmod +x /scripts/docker-entrypoint.sh
# ENTRYPOINT ["/scripts/docker-entrypoint.sh"]
