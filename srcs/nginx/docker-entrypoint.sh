#!/bin/sh
if [ -z "$NGINX_PORT" ]; then
  echo "NGINX_PORT environment variable is not set."
  exit 1
fi

sed -i "s/443/${NGINX_PORT}/g" /etc/nginx/nginx.conf
exec nginx -g 'daemon off;'
