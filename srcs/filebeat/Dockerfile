FROM docker.elastic.co/beats/filebeat:7.12.0

# Switch to root user to perform administrative tasks
USER root

# Copy the custom entrypoint script
COPY entrypoint.sh /usr/local/bin/entrypoint.sh

# Copy the filebeat configuration file and set ownership
COPY filebeat.yml /usr/share/filebeat/filebeat.yml
RUN chown root:filebeat /usr/share/filebeat/filebeat.yml
RUN chmod 644 /usr/share/filebeat/filebeat.yml

# Make the entrypoint script executable
RUN chmod +x /usr/local/bin/entrypoint.sh

# Set the entrypoint to the custom script
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# Switch back to the default user
USER filebeat
