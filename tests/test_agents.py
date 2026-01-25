"""
Simple test script for AI Agents system
Run this after starting the server to verify agents are working
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000/api"

def print_section(title):
    """Print section header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def test_health():
    """Test API health"""
    print_section("Testing API Health")
    response = requests.get(f"{BASE_URL}/health")
    if response.status_code == 200:
        print("✅ API is healthy")
        print(json.dumps(response.json(), indent=2))
        return True
    else:
        print("❌ API health check failed")
        return False

def test_list_agents():
    """Test listing agents"""
    print_section("Listing All Agents")
    response = requests.get(f"{BASE_URL}/agents")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Found {data['total']} agents:")
        for agent in data['agents']:
            print(f"   - {agent['name']} ({agent['agent_type']}) - Status: {agent['status']}")
        return True
    else:
        print("❌ Failed to list agents")
        print(response.text)
        return False

def test_query_supervisor(query):
    """Test querying the supervisor agent"""
    print_section(f"Querying Supervisor Agent: '{query}'")
    
    response = requests.post(
        f"{BASE_URL}/agents/query",
        params={"agent_type": "supervisor"},
        json={
            "query": query,
            "session_id": "test-session-" + str(int(time.time())),
            "include_history": True
        }
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Query successful")
        print(f"\nAgent: {result.get('agent')}")
        print(f"Routed to: {result.get('routed_to', [])}")
        print(f"Execution time: {result.get('execution_time_ms')}ms")
        print(f"\nResponse:\n{result.get('response')}")
        
        if result.get('tool_calls'):
            print(f"\nTool calls made: {len(result['tool_calls'])}")
            for i, tool_call in enumerate(result['tool_calls'], 1):
                print(f"  {i}. {tool_call.get('tool')}")
        
        return True
    else:
        print("❌ Query failed")
        print(response.text)
        return False

def test_query_specialized(agent_type, query):
    """Test querying a specialized agent"""
    print_section(f"Querying {agent_type.replace('_', ' ').title()} Agent")
    print(f"Query: {query}")
    
    response = requests.post(
        f"{BASE_URL}/agents/query",
        params={"agent_type": agent_type},
        json={
            "query": query,
            "session_id": f"test-{agent_type}-{int(time.time())}"
        }
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Query successful")
        print(f"\nResponse:\n{result.get('response')}")
        return True
    else:
        print("❌ Query failed")
        print(response.text)
        return False

def test_agent_stats():
    """Test getting agent statistics"""
    print_section("Getting Agent Statistics")
    
    # First get list of agents
    response = requests.get(f"{BASE_URL}/agents")
    if response.status_code != 200:
        print("❌ Failed to get agents list")
        return False
    
    agents = response.json()['agents']
    if not agents:
        print("❌ No agents found")
        return False
    
    # Get stats for first agent
    agent_id = agents[0]['id']
    agent_name = agents[0]['name']
    
    response = requests.get(f"{BASE_URL}/agents/{agent_id}/stats")
    
    if response.status_code == 200:
        stats = response.json()
        print(f"✅ Statistics for {agent_name}:")
        print(json.dumps(stats, indent=2))
        return True
    else:
        print("❌ Failed to get agent stats")
        return False

def test_tool_stats():
    """Test getting tool execution statistics"""
    print_section("Getting Tool Statistics")
    
    response = requests.get(f"{BASE_URL}/agents/tools/stats")
    
    if response.status_code == 200:
        stats = response.json()
        print("✅ Tool execution statistics:")
        print(json.dumps(stats, indent=2))
        return True
    else:
        print("❌ Failed to get tool stats")
        return False

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("  OverSight AI Agents - Test Suite")
    print("="*60)
    print("\nMake sure the server is running at http://localhost:8000")
    print("and you have initialized the agents with: python scripts/init_agents.py")
    
    input("\nPress Enter to start testing...")
    
    # Track results
    results = []
    
    # Test 1: Health check
    results.append(("Health Check", test_health()))
    
    # Test 2: List agents
    results.append(("List Agents", test_list_agents()))
    
    # Test 3: Query supervisor
    results.append(("Supervisor Query", test_query_supervisor("What collections are available?")))
    
    # Test 4: Query data discovery agent
    results.append(("Data Discovery", test_query_specialized("data_discovery", "Find all available datasets")))
    
    # Test 5: Query analytics agent
    results.append(("Analytics", test_query_specialized("analytics", "Show me analytics statistics")))
    
    # Test 6: Query compliance agent
    results.append(("Compliance", test_query_specialized("compliance", "Check for PII datasets")))
    
    # Test 7: Agent stats
    results.append(("Agent Stats", test_agent_stats()))
    
    # Test 8: Tool stats
    results.append(("Tool Stats", test_tool_stats()))
    
    # Print summary
    print_section("Test Summary")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\n{'='*60}")
    print(f"Results: {passed}/{total} tests passed")
    print(f"{'='*60}\n")
    
    if passed == total:
        print("🎉 All tests passed! Your AI Agents system is working correctly.")
    else:
        print(f"⚠️  {total - passed} test(s) failed. Check the output above for details.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
    except Exception as e:
        print(f"\n❌ Error running tests: {e}")
        import traceback
        traceback.print_exc()
