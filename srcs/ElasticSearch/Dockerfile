# Use the official Elasticsearch image as the base image
FROM docker.elastic.co/elasticsearch/elasticsearch:7.13.2

RUN if ! getent group elasticsearch > /dev/null 2>&1; then \
      groupadd -g 1000 elasticsearch; \
    fi && \
    if ! id -u elasticsearch > /dev/null 2>&1; then \
      useradd -u 1000 -g elasticsearch -s /bin/bash -m elasticsearch; \
    fi

# Copy the script to create the keystore and add keys
COPY elasticsearch-security.sh /usr/share/elasticsearch/create_keystore.sh

# Set the script to be executable
RUN chmod +x /usr/share/elasticsearch/create_keystore.sh

# Set permissions for the Elasticsearch directories
RUN chown -R elasticsearch:elasticsearch /usr/share/elasticsearch

# Switch to the non-root user
USER elasticsearch

# Ensure the keystore is created and keys are added before starting Elasticsearch
ENTRYPOINT ["/bin/bash", "-c", "/usr/share/elasticsearch/create_keystore.sh && exec elasticsearch"]
