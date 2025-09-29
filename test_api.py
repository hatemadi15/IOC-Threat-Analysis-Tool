#!/usr/bin/env python3
"""
Quick API test script
"""
import requests
import json

def test_api():
    """Test the API endpoints"""
    base_url = "http://localhost:8000"
    
    print("🚀 Testing Threat IOC Analysis Tool API")
    print("=" * 50)
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health")
        print(f"✅ Health Check: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Health Check Failed: {e}")
        return
    
    # Test root endpoint
    try:
        response = requests.get(f"{base_url}/")
        print(f"✅ Root Endpoint: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Root Endpoint Failed: {e}")
    
    # Test stats endpoint
    try:
        response = requests.get(f"{base_url}/api/v1/stats")
        print(f"✅ Stats Endpoint: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Stats Endpoint Failed: {e}")
    
    # Test IOC analysis endpoint
    try:
        test_data = {"indicator": "8.8.8.8"}
        response = requests.post(
            f"{base_url}/api/v1/analyze",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"✅ IOC Analysis: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   Analysis ID: {result.get('analysis_id', 'N/A')}")
            print(f"   Status: {result.get('status', 'N/A')}")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ IOC Analysis Failed: {e}")
    
    print("\n🎉 API Test Complete!")
    print(f"\n📚 Open http://localhost:8000/docs in your browser to explore the API!")

if __name__ == "__main__":
    test_api()

