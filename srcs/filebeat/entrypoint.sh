#!/bin/bash
set -e

# Execute the original entrypoint if arguments are provided
if [ $# -eq 0 ]; then
    echo "No arguments provided to the entrypoint script."
    exit 1
else
    exec /usr/local/bin/docker-entrypoint "$@"
fi
