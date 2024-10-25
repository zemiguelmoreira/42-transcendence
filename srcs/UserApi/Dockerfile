FROM python:3.10-slim
RUN apt-get update && \
apt-get install -y libcairo2-dev
WORKDIR /usr/src/app
ENV DJANGO_SETTINGS_MODULE=UserApi.settings
RUN pip3 install --upgrade pip
RUN pip3 install psycopg2-binary


RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

ENV RUSTUP_HOME="/root/.rustup"
ENV CARGO_HOME="/root/.cargo"

COPY ./requirements.txt /usr/src/app/requirements.txt
RUN pip3 install -r requirements.txt

COPY . /usr/src/app/

COPY ./docker-entrypoint.sh /scripts/
RUN chmod +x /scripts/docker-entrypoint.sh

ENTRYPOINT ["/scripts/docker-entrypoint.sh"]
