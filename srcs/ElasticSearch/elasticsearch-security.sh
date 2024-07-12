#!/bin/bash

# Check if the keystore file exists
if [ ! -f /usr/share/elasticsearch/config/elasticsearch.keystore ]; then
  # Create the keystore
  bin/elasticsearch-keystore create

  # Add the bootstrap password to the keystore
  echo "${ELASTIC_PASSWORD}" | bin/elasticsearch-keystore add -x 'bootstrap.password'
fi
