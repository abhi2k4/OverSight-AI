.PHONY: help build push deploy clean logs status

# Default values
REGISTRY ?= 
VERSION ?= 1.0.0
ENVIRONMENT ?= dev
DEPLOYMENT_TYPE ?= docker-compose

help: ## Show this help message
	@echo "OverSight Deployment Makefile"
	@echo "=============================="
	@echo ""
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

build: ## Build Docker images
	@echo "Building Docker images..."
	@bash build.sh

push: ## Push Docker images to registry
	@echo "Pushing Docker images..."
	@docker push $(REGISTRY)oversight-backend:$(VERSION)
	@docker push $(REGISTRY)oversight-frontend:$(VERSION)
	@docker push $(REGISTRY)oversight-backend:latest
	@docker push $(REGISTRY)oversight-frontend:latest

deploy: ## Deploy the application
	@echo "Deploying OverSight..."
	@DEPLOYMENT_TYPE=$(DEPLOYMENT_TYPE) ENVIRONMENT=$(ENVIRONMENT) bash deploy.sh

deploy-docker: ## Deploy using Docker Compose
	@DEPLOYMENT_TYPE=docker-compose make deploy

deploy-helm: ## Deploy using Helm
	@DEPLOYMENT_TYPE=helm ENVIRONMENT=$(ENVIRONMENT) make deploy

clean: ## Stop and remove containers, volumes
	@echo "Cleaning up..."
	@docker-compose down -v

logs: ## Show logs from all services
	@docker-compose logs -f

logs-backend: ## Show backend logs
	@docker-compose logs -f backend

logs-frontend: ## Show frontend logs
	@docker-compose logs -f frontend

status: ## Show service status
	@docker-compose ps

restart: ## Restart all services
	@docker-compose restart

stop: ## Stop all services
	@docker-compose stop

start: ## Start all services
	@docker-compose start

up: ## Start services in foreground
	@docker-compose up

down: ## Stop and remove containers
	@docker-compose down

test: ## Run health checks
	@echo "Testing services..."
	@curl -f http://localhost:8000/api/health && echo "✓ Backend healthy" || echo "✗ Backend unhealthy"
	@curl -f http://localhost:3003/health && echo "✓ Frontend healthy" || echo "✗ Frontend unhealthy"

setup-env: ## Setup environment file
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "Created .env file. Please edit it with your configuration."; \
	else \
		echo ".env file already exists."; \
	fi
