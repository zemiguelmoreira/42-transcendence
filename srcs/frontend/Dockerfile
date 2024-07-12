FROM nginx:1.25.5-bookworm
RUN apt-get update
COPY ./index.html /usr/share/nginx/html
COPY ./conf/default.conf /etc/nginx/conf.d
