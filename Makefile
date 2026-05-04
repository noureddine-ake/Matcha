# ===============================
# Docker Compose Makefile
# ===============================

COMPOSE = docker compose
COMPOSE_PROD = docker compose -f docker-compose.prod.yml

.PHONY: dev dev-d prod prod-d down down-prod rm restart logs ps prune clean

# ===============================
# Development
# ===============================
# Build and start development containers (attached logs)
dev:
	$(COMPOSE) up --build

# Build and start development containers (detached)
dev-d:
	$(COMPOSE) up -d --build

# Stop development containers
down:
	$(COMPOSE) down

# ===============================
# Production
# ===============================
# Build and start production containers (attached logs)
prod:
	$(COMPOSE_PROD) up --build

# Build and start production containers (detached)
prod-d:
	$(COMPOSE_PROD) up -d --build

# Stop production containers
down-prod:
	$(COMPOSE_PROD) down

# ===============================
# Utilities
# ===============================
# Rebuild and start development
restart:
	$(COMPOSE) down
	$(COMPOSE) up -d --build

# Remove stopped containers
rm:
	$(COMPOSE) rm -f
	$(COMPOSE_PROD) rm -f

# Show logs (development)
logs:
	$(COMPOSE) logs -f

# Show running containers
ps:
	$(COMPOSE) ps

# Clean unused docker resources globally
prune:
	docker system prune -af

# Fully remove containers, networks, and volumes for BOTH environments
clean:
	$(COMPOSE) down -v --remove-orphans
	$(COMPOSE_PROD) down -v --remove-orphans