FROM docker.elastic.co/beats/filebeat:7.5.1

COPY filebeat.yml /usr/share/filebeat/filebeat.yml
USER root
RUN chown root:root /usr/share/filebeat/filebeat.yml
RUN chmod 644 /usr/share/filebeat/filebeat.yml

# sudo chown root:root /path/to/filebeat/filebeat.yml
# sudo chmod 644 /path/to/filebeat/filebeat.yml

ENTRYPOINT ["filebeat", "-e"]
