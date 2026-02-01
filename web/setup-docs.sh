#!/bin/bash

# OverSightAI - Documentation Setup Script
# This script sets up the documentation site and main app

set -e

echo "🚀 Setting up OverSightAI - Main App & Documentation"
echo "======================================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the /web directory"
    exit 1
fi

echo "${BLUE}Step 1: Installing main app dependencies...${NC}"
npm install
echo "${GREEN}✅ Main app dependencies installed${NC}"
echo ""

echo "${BLUE}Step 2: Installing documentation dependencies...${NC}"
cd src/docs
npm install
cd ../..
echo "${GREEN}✅ Documentation dependencies installed${NC}"
echo ""

echo "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "Available commands:"
echo "-------------------"
echo ""
echo "${YELLOW}Development:${NC}"
echo "  npm run dev           - Start main app (http://localhost:5173)"
echo "  npm run docs:dev      - Start docs (http://localhost:3000)"
echo ""
echo "${YELLOW}Building:${NC}"
echo "  npm run build         - Build main app"
echo "  npm run docs:build    - Build docs"
echo "  npm run build:all     - Build both"
echo ""
echo "${YELLOW}Preview:${NC}"
echo "  npm run preview       - Preview main app"
echo "  npm run docs:serve    - Preview docs"
echo ""
echo "To start developing, run:"
echo "  ${GREEN}npm run dev${NC}        (in one terminal)"
echo "  ${GREEN}npm run docs:dev${NC}   (in another terminal)"
echo ""
