"""
Test script for Product Agent
"""
import requests
import json

BASE_URL = "http://localhost:8000/api"

def print_section(title):
    """Print section header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def test_product_agent():
    """Test the Product Agent with various queries"""
    
    print_section("Testing Product Agent")
    
    product_queries = [
        "What product data is available?",
        "Show me all products in the catalog",
        "What are the product details?",
        "List product inventory",
        "Give me product insights and statistics"
    ]
    
    for query in product_queries:
        print(f"\n📦 Query: {query}")
        print("-" * 60)
        
        try:
            response = requests.post(
                f"{BASE_URL}/agents/query",
                json={
                    "query": query,
                    "agent_id": None,  # Let supervisor route it
                    "session_id": "test_product_session"
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Response from: {data.get('agent', 'Unknown')}")
                print(f"\n{data.get('response', 'No response')}\n")
                
                if data.get('tool_calls'):
                    print(f"🔧 Tools used: {', '.join([t.get('tool') for t in data.get('tool_calls', [])])}")
            else:
                print(f"❌ Failed: {response.status_code}")
                print(response.text)
        
        except Exception as e:
            print(f"❌ Error: {e}")

def test_direct_product_agent():
    """Test Product Agent directly"""
    print_section("Testing Product Agent Directly")
    
    try:
        # First, get the Product Agent ID
        agents_response = requests.get(f"{BASE_URL}/agents")
        if agents_response.status_code == 200:
            agents = agents_response.json().get('agents', [])
            product_agent = next((a for a in agents if a['agent_type'] == 'product'), None)
            
            if product_agent:
                print(f"✅ Found Product Agent: {product_agent['name']} (ID: {product_agent['id']})")
                
                # Query the Product Agent directly
                query = "Find and analyze all product data in the system. Give me comprehensive product insights."
                print(f"\n📦 Query: {query}\n")
                
                response = requests.post(
                    f"{BASE_URL}/agents/query",
                    json={
                        "query": query,
                        "agent_id": product_agent['id'],
                        "session_id": "test_direct_product"
                    },
                    timeout=30
                )
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ Response:\n")
                    print(data.get('response', 'No response'))
                    
                    if data.get('tool_calls'):
                        print(f"\n\n🔧 Tool Calls Made:")
                        for tool_call in data.get('tool_calls', []):
                            print(f"  - {tool_call.get('tool')}: {tool_call.get('status')}")
                else:
                    print(f"❌ Failed: {response.status_code}")
                    print(response.text)
            else:
                print("❌ Product Agent not found")
        
    except Exception as e:
        print(f"❌ Error: {e}")

def test_product_vs_sales():
    """Test queries that involve both Product and Sales agents"""
    print_section("Testing Product + Sales Agent Coordination")
    
    queries = [
        "What are our best-selling products?",
        "Show me product performance and revenue"
    ]
    
    for query in queries:
        print(f"\n🔄 Query: {query}")
        print("-" * 60)
        
        try:
            response = requests.post(
                f"{BASE_URL}/agents/query",
                json={
                    "query": query,
                    "session_id": "test_multi_agent"
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Coordinated by: {data.get('agent', 'Unknown')}")
                
                if data.get('routed_to'):
                    print(f"📍 Routed to: {', '.join(data.get('routed_to', []))}")
                
                print(f"\n{data.get('response', 'No response')}\n")
            else:
                print(f"❌ Failed: {response.status_code}")
        
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("\n🚀 Product Agent Test Suite")
    print("=" * 60)
    
    # Test routing to Product Agent
    test_product_agent()
    
    # Test direct Product Agent query
    test_direct_product_agent()
    
    # Test multi-agent coordination
    test_product_vs_sales()
    
    print("\n" + "=" * 60)
    print("✅ Product Agent Testing Complete!")
    print("=" * 60 + "\n")
