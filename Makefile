NAME =		transcendence

YML =		./srcs/docker-compose.yml



all:		build $(NAME)

check-prerequisites: check-hosts check-volumes check-env

check-hosts:
	@if ! grep -q "127.0.0.1 localhost" /etc/hosts; then \
		sudo sh -c 'echo "127.0.0.1 localhost" >> /etc/hosts'; \
	fi

check-volumes:
	@if [ ! -d "$(HOME)/data" ]; then \
		sudo mkdir -p "$(HOME)/data"; \
	fi

check-env:
	@if [ ! -f ./srcs/.env ]; then \
		echo "Error: Missing .env file in srcs/"; \
		exit 1; \
	fi

build:		check-volumes check-prerequisites
			@docker compose -f $(YML) build

$(NAME):	up

up:			build
			@docker compose -f $(YML) up

down:
			@docker compose -f $(YML) down

start:
			@docker compose -f $(YML) start

stop:
			@docker compose -f $(YML) stop

rm:			stop
			@docker compose -f $(YML) rm -f

rmi:
			@docker compose -f $(YML) down --rmi all

rmv:
			@docker compose -f $(YML) down --volumes

clean:
			@docker compose -f $(YML) down --rmi all --volumes

fclean:		clean

re: 		fclean all

.PHONY:		all up down start stop rm rmi rmv clean fclean re
