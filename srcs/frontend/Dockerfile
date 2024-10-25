FROM nginx:1.25.5-bookworm
RUN apt-get update
COPY ./conf/default.conf /etc/nginx/conf.d/default.conf
COPY ./www /usr/share/nginx/html
