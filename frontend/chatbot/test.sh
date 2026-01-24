#!/bin/bash

# Quick test script for the chatbot API
echo "🧪 Testing OverSight Chatbot API"
echo "================================"
echo ""

BASE_URL="http://localhost:3001"

# Test 1: Health Check
echo "1️⃣  Testing health endpoint..."
HEALTH=$(curl -s "$BASE_URL/api/health")
if [ $? -eq 0 ]; then
    echo "✅ Health check passed"
    echo "$HEALTH" | jq '.' 2>/dev/null || echo "$HEALTH"
else
    echo "❌ Server not running. Start with: npm start"
    exit 1
fi
echo ""

# Test 2: Chat Completion
echo "2️⃣  Testing chat completion..."
CHAT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/chat" \
    -H "Content-Type: application/json" \
    -d '{
        "message": "What is GDPR?",
        "userId": "test-user"
    }')

if echo "$CHAT_RESPONSE" | grep -q "response"; then
    echo "✅ Chat completion successful"
    echo "$CHAT_RESPONSE" | jq '.metadata' 2>/dev/null
else
    echo "❌ Chat completion failed"
    echo "$CHAT_RESPONSE"
fi
echo ""

# Test 3: Metrics
echo "3️⃣  Testing metrics endpoint..."
METRICS=$(curl -s "$BASE_URL/api/metrics")
if [ $? -eq 0 ]; then
    echo "✅ Metrics retrieved"
    echo "$METRICS" | jq '.overview' 2>/dev/null || echo "$METRICS"
else
    echo "❌ Failed to get metrics"
fi
echo ""

echo "✨ Testing complete!"
echo ""
echo "💡 Next steps:"
echo "   - Open http://localhost:9002 (your React app)"
echo "   - Navigate to 'Chatbot Monitor'"
echo "   - Start chatting!"
echo "   - Check LangFuse: https://cloud.langfuse.com"
