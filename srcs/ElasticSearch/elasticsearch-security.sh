#!/bin/bash

# Configurar segurança no Elasticsearch
./bin/elasticsearch-setup-passwords auto -b

# Criar usuário e definir papéis
./bin/elasticsearch-users useradd elastic_user -p elastic123 -r superuser

# Outras configurações de segurança podem ser adicionadas aqui

# Reiniciar o Elasticsearch para aplicar as configurações
./bin/elasticsearch -d