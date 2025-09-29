#!/usr/bin/env python3
"""
Simple API test script that works without external dependencies
"""

import requests
import json
import time

def test_api_endpoints():
    """Test the API endpoints"""
    base_url = "http://localhost:8000"
    
    print("🧪 Testing API Endpoints")
    print("=" * 50)
    
    # Test root endpoint
    try:
        response = requests.get(f"{base_url}/")
        print(f"✅ Root endpoint: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Root endpoint failed: {e}")
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health")
        print(f"✅ Health endpoint: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Health endpoint failed: {e}")
    
    # Test stats endpoint
    try:
        response = requests.get(f"{base_url}/api/v1/stats")
        print(f"✅ Stats endpoint: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Stats endpoint failed: {e}")

def start_server_instructions():
    """Show how to start the server"""
    print("\n🚀 To Start the API Server:")
    print("=" * 50)
    print("1. Open a new terminal")
    print("2. Navigate to your project directory")
    print("3. Run: uvicorn main:app --reload")
    print("4. Wait for: 'Uvicorn running on http://127.0.0.1:8000'")
    print("5. Open: http://localhost:8000/docs")
    print("\nThen run this test script again!")

def main():
    """Main function"""
    print("🚀 Threat IOC Analysis Tool - API Test")
    print("This tests the API endpoints")
    
    # Try to test endpoints
    test_api_endpoints()
    
    # Show instructions
    start_server_instructions()

if __name__ == "__main__":
    main()
