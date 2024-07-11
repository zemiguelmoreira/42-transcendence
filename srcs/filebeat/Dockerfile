FROM docker.elastic.co/beats/filebeat:7.5.1

COPY filebeat.yml /usr/share/filebeat/filebeat.yml
USER root
RUN chmod go-w /usr/share/filebeat/filebeat.yml
RUN chown root:root /usr/share/filebeat/filebeat.yml

ENTRYPOINT ["filebeat", "-e"]
