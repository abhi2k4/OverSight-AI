#!/bin/bash
# Build script for OverSight Docker images

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REGISTRY="${DOCKER_REGISTRY:-}"
BACKEND_IMAGE="${BACKEND_IMAGE:-oversight-backend}"
FRONTEND_IMAGE="${FRONTEND_IMAGE:-oversight-frontend}"
VERSION="${VERSION:-1.0.0}"

echo -e "${GREEN}Building OverSight Docker images...${NC}"

# Build backend
echo -e "${YELLOW}Building backend image...${NC}"
docker build -f deployment/Dockerfile.backend \
  -t ${REGISTRY}${BACKEND_IMAGE}:${VERSION} \
  -t ${REGISTRY}${BACKEND_IMAGE}:latest \
  .

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Backend image built successfully${NC}"
else
  echo -e "${RED}✗ Backend image build failed${NC}"
  exit 1
fi

# Build frontend
echo -e "${YELLOW}Building frontend image...${NC}"
docker build -f deployment/Dockerfile.frontend \
  -t ${REGISTRY}${FRONTEND_IMAGE}:${VERSION} \
  -t ${REGISTRY}${FRONTEND_IMAGE}:latest \
  .

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Frontend image built successfully${NC}"
else
  echo -e "${RED}✗ Frontend image build failed${NC}"
  exit 1
fi

echo -e "${GREEN}All images built successfully!${NC}"
echo ""
echo "Images:"
echo "  - ${REGISTRY}${BACKEND_IMAGE}:${VERSION}"
echo "  - ${REGISTRY}${BACKEND_IMAGE}:latest"
echo "  - ${REGISTRY}${FRONTEND_IMAGE}:${VERSION}"
echo "  - ${REGISTRY}${FRONTEND_IMAGE}:latest"
echo ""
echo "To push images:"
echo "  docker push ${REGISTRY}${BACKEND_IMAGE}:${VERSION}"
echo "  docker push ${REGISTRY}${FRONTEND_IMAGE}:${VERSION}"
