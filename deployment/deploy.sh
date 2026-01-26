#!/bin/bash
# Deployment script for OverSight

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_TYPE="${DEPLOYMENT_TYPE:-docker-compose}"
ENVIRONMENT="${ENVIRONMENT:-dev}"

echo -e "${BLUE}OverSight Deployment Script${NC}"
echo "================================"
echo ""

# Check prerequisites
check_prerequisites() {
  echo -e "${YELLOW}Checking prerequisites...${NC}"
  
  if [ "$DEPLOYMENT_TYPE" == "docker-compose" ]; then
    if ! command -v docker &> /dev/null; then
      echo -e "${RED}✗ Docker is not installed${NC}"
      exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
      echo -e "${RED}✗ Docker Compose is not installed${NC}"
      exit 1
    fi
    
    echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"
  elif [ "$DEPLOYMENT_TYPE" == "helm" ]; then
    if ! command -v kubectl &> /dev/null; then
      echo -e "${RED}✗ kubectl is not installed${NC}"
      exit 1
    fi
    
    if ! command -v helm &> /dev/null; then
      echo -e "${RED}✗ Helm is not installed${NC}"
      exit 1
    fi
    
    echo -e "${GREEN}✓ kubectl and Helm are installed${NC}"
  fi
}

# Docker Compose deployment
deploy_docker_compose() {
  echo -e "${YELLOW}Deploying with Docker Compose...${NC}"
  
  # Check if .env exists
  if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env from .env.example...${NC}"
    cp .env.example .env
    echo -e "${RED}⚠ Please edit .env file with your configuration before continuing${NC}"
    exit 1
  fi
  
  # Build and start services
  echo -e "${YELLOW}Building and starting services...${NC}"
  docker-compose up -d --build
  
  # Wait for services to be healthy
  echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
  sleep 10
  
  # Check service status
  docker-compose ps
  
  echo -e "${GREEN}✓ Deployment complete!${NC}"
  echo ""
  echo "Services:"
  echo "  - Frontend: http://localhost:3003"
  echo "  - Backend API: http://localhost:8000"
  echo "  - API Docs: http://localhost:8000/docs"
  echo "  - MinIO Console: http://localhost:9001"
  echo "  - Keycloak: http://localhost:8080"
}

# Helm deployment
deploy_helm() {
  echo -e "${YELLOW}Deploying with Helm...${NC}"
  
  # Select values file based on environment
  VALUES_FILE="helm/oversight/values.yaml"
  if [ "$ENVIRONMENT" == "production" ]; then
    VALUES_FILE="helm/oversight/values-production.yaml"
  elif [ "$ENVIRONMENT" == "dev" ]; then
    VALUES_FILE="helm/oversight/values-dev.yaml"
  fi
  
  # Check if values file exists
  if [ ! -f "$VALUES_FILE" ]; then
    echo -e "${RED}✗ Values file not found: $VALUES_FILE${NC}"
    exit 1
  fi
  
  # Install or upgrade
  if helm list | grep -q oversight; then
    echo -e "${YELLOW}Upgrading existing deployment...${NC}"
    helm upgrade oversight ./helm/oversight -f "$VALUES_FILE"
  else
    echo -e "${YELLOW}Installing new deployment...${NC}"
    helm install oversight ./helm/oversight -f "$VALUES_FILE"
  fi
  
  # Wait for deployment
  echo -e "${YELLOW}Waiting for pods to be ready...${NC}"
  kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=oversight --timeout=300s
  
  # Show status
  kubectl get pods -l app.kubernetes.io/name=oversight
  
  echo -e "${GREEN}✓ Deployment complete!${NC}"
}

# Main execution
main() {
  check_prerequisites
  
  if [ "$DEPLOYMENT_TYPE" == "docker-compose" ]; then
    deploy_docker_compose
  elif [ "$DEPLOYMENT_TYPE" == "helm" ]; then
    deploy_helm
  else
    echo -e "${RED}✗ Unknown deployment type: $DEPLOYMENT_TYPE${NC}"
    echo "Supported types: docker-compose, helm"
    exit 1
  fi
}

# Run main function
main
