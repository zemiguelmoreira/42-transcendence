#!/bin/bash
# Custom entrypoint script to adjust permissions

# Ensure the file has the correct permissions
chmod 644 /usr/share/filebeat/filebeat.yml

# Execute the original entrypoint
exec /usr/local/bin/docker-entrypoint "$@"