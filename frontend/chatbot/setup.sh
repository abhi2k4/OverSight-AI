#!/bin/bash

# OverSight Chatbot Quick Setup Script
echo "🤖 OverSightAI Chatbot Setup"
echo "=============================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the chatbot/ directory"
    exit 1
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Warning: Node.js version 18+ recommended (you have v$NODE_VERSION)"
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Check for .env file
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: You need to add your API keys to the .env file:"
    echo ""
    echo "   1. OpenAI API Key:"
    echo "      - Get from: https://platform.openai.com/api-keys"
    echo "      - Add to: OPENAI_API_KEY in .env"
    echo ""
    echo "   2. LangFuse Keys:"
    echo "      - Sign up at: http://localhost:3000"
    echo "      - Create a project"
    echo "      - Get keys from: Settings → API Keys"
    echo "      - Add LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY to .env"
    echo ""
    echo "   3. After adding keys, run: npm start"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
    
    # Check if keys are configured
    if grep -q "your_openai_api_key_here" .env || grep -q "your_langfuse" .env; then
        echo "⚠️  Warning: API keys not configured in .env"
        echo "   Please edit .env and add your OpenAI and LangFuse keys"
        echo ""
    else
        echo "✅ API keys appear to be configured"
        echo ""
        echo "🚀 Setup complete! You can now start the server:"
        echo ""
        echo "   npm start"
        echo ""
        echo "   Server will run on: http://localhost:3001"
        echo ""
        echo "📊 Endpoints:"
        echo "   POST http://localhost:3001/api/chat      - Send messages"
        echo "   GET  http://localhost:3001/api/metrics   - View metrics"
        echo "   GET  http://localhost:3001/api/health    - Health check"
        echo ""
        echo "💡 Open the React app and go to 'Chatbot Monitor' to test!"
        echo ""
    fi
fi

echo "📖 For more details, see: README.md"
