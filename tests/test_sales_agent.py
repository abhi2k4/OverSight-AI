"""
Test script for Sales Agent
"""
import requests
import json

BASE_URL = "http://localhost:8000/api"

def print_section(title):
    """Print section header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def test_sales_agent():
    """Test the Sales Agent with various queries"""
    
    print_section("Testing Sales Agent")
    
    sales_queries = [
        "What sales data is available?",
        "Show me total revenue from sales",
        "Who are the top customers by revenue?",
        "Analyze sales transactions",
        "Give me sales insights and business intelligence"
    ]
    
    for query in sales_queries:
        print(f"\n📊 Query: {query}")
        print("-" * 60)
        
        try:
            response = requests.post(
                f"{BASE_URL}/agents/query",
                json={
                    "query": query,
                    "agent_id": None,  # Let supervisor route it
                    "session_id": "test_sales_session"
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

def test_direct_sales_agent():
    """Test Sales Agent directly"""
    print_section("Testing Sales Agent Directly")
    
    try:
        # First, get the Sales Agent ID
        agents_response = requests.get(f"{BASE_URL}/agents")
        if agents_response.status_code == 200:
            agents = agents_response.json().get('agents', [])
            sales_agent = next((a for a in agents if a['agent_type'] == 'sales'), None)
            
            if sales_agent:
                print(f"✅ Found Sales Agent: {sales_agent['name']} (ID: {sales_agent['id']})")
                
                # Query the Sales Agent directly
                query = "Analyze all sales data and give me comprehensive business insights"
                print(f"\n📊 Query: {query}\n")
                
                response = requests.post(
                    f"{BASE_URL}/agents/query",
                    json={
                        "query": query,
                        "agent_id": sales_agent['id'],
                        "session_id": "test_direct_sales"
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
                print("❌ Sales Agent not found")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("\n🚀 Sales Agent Test Suite")
    print("=" * 60)
    
    # Test routing to Sales Agent
    test_sales_agent()
    
    # Test direct Sales Agent query
    test_direct_sales_agent()
    
    print("\n" + "=" * 60)
    print("✅ Sales Agent Testing Complete!")
    print("=" * 60 + "\n")
