#!/bin/bash

# OverSight AI - Vercel Deployment Script
# This script helps deploy both the main site and docs to Vercel

set -e

echo "🚀 OverSight AI - Vercel Deployment"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Function to deploy main site
deploy_main() {
    echo -e "${BLUE}📦 Deploying Main Website...${NC}"
    cd web
    
    echo "  → Installing dependencies..."
    npm install
    
    echo "  → Building..."
    npm run build
    
    echo "  → Deploying to Vercel..."
    vercel --prod
    
    cd ..
    echo -e "${GREEN}✅ Main site deployed!${NC}"
    echo ""
}

# Function to deploy docs
deploy_docs() {
    echo -e "${BLUE}📚 Deploying Documentation...${NC}"
    cd web/src/docs
    
    echo "  → Installing dependencies..."
    npm install
    
    echo "  → Building..."
    npm run build
    
    echo "  → Deploying to Vercel..."
    vercel --prod
    
    cd ../../..
    echo -e "${GREEN}✅ Docs deployed!${NC}"
    echo ""
}

# Main menu
echo "What would you like to deploy?"
echo "1) Main website only"
echo "2) Documentation only"
echo "3) Both (recommended)"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        deploy_main
        ;;
    2)
        deploy_docs
        ;;
    3)
        deploy_main
        deploy_docs
        ;;
    *)
        echo -e "${YELLOW}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Configure custom domains in Vercel dashboard"
echo "2. Update DNS records with your registrar"
echo "3. Test both sites after DNS propagation"
echo ""
echo "📚 See VERCEL_TWO_PROJECTS.md for detailed instructions"
