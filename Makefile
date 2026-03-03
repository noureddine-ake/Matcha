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

# Build containers
build:
	$(COMPOSE) build

# Rebuild and start
restart:
	$(COMPOSE) down
	$(COMPOSE) up -d --build

# Show logs
logs:
	$(COMPOSE) logs -f

# Show running containers
ps:
	$(COMPOSE) ps

# Remove containers, networks, volumes
clean:
	$(COMPOSE) down -v --remove-orphans