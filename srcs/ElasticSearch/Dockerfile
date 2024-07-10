# Dockerfile para Elasticsearch com configuração de segurança
FROM docker.elastic.co/elasticsearch/elasticsearch:7.13.2


COPY elasticsearch-security.sh /usr/share/elasticsearch/elasticsearch-security.sh

USER root

RUN chmod +x /usr/share/elasticsearch/elasticsearch-security.sh
RUN /bin/bash -c '/usr/share/elasticsearch/elasticsearch-security.sh'

EXPOSE 9200 9300

# Inicie o Elasticsearch
CMD ["elasticsearch"]
