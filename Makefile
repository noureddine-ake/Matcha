# ===============================
# Docker Compose Makefile
# ===============================

COMPOSE = docker compose

.PHONY: up down build restart logs ps clean

# Start containers
up:
	$(COMPOSE) up -d 

# Stop containers
down:
	$(COMPOSE) down

# remove container
rm:
	$(COMPOSE) rm -f
# Build containers
build:
	$(COMPOSE) build

# Rebuild and start
restart:
	$(COMPOSE) down
	$(COMPOSE) up -d 

# Show logs
logs:
	$(COMPOSE) logs -f

# Show running containers
ps:
	$(COMPOSE) ps

prune:
	docker system prune -af

# Remove containers, networks, volumes
clean:
	$(COMPOSE) down -v --remove-orphans