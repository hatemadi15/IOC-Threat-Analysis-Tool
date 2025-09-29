#!/usr/bin/env python3
"""
Basic test script for the Threat IOC Analysis Tool
Tests IOC parsing and analysis engine without requiring API keys
"""

import asyncio
from app.services.ioc_parser import IOCParser
from app.services.analysis_engine import AnalysisEngine

def test_ioc_parser():
    """Test IOC parsing functionality"""
    print("🧪 Testing IOC Parser...")
    
    parser = IOCParser()
    
    # Test cases
    test_cases = [
        ("https://example.com", "URL"),
        ("example.com", "DOMAIN"),
        ("192.168.1.1", "IP_ADDRESS"),
        ("8.8.8.8", "IP_ADDRESS"),
        ("d41d8cd98f00b204e9800998ecf8427e", "HASH_MD5"),
        ("a94a8fe5ccb19ba61c4c0873d391e987982fbbd3", "HASH_SHA1"),
        ("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "HASH_SHA256"),
        ("test@example.com", "EMAIL"),
        ("invalid-input", "UNKNOWN")
    ]
    
    for indicator, expected_type in test_cases:
        ioc_type, is_valid, error_message = parser.parse_ioc(indicator)
        status = "✅" if is_valid else "❌"
        print(f"   {status} {indicator} -> {ioc_type.value} (Expected: {expected_type})")
        
        if is_valid:
            normalized = parser.normalize_ioc(indicator, ioc_type)
            print(f"      Normalized: {normalized}")

def test_analysis_engine():
    """Test analysis engine functionality"""
    print("\n🧪 Testing Analysis Engine...")
    
    engine = AnalysisEngine()
    
    # Mock threat intelligence results
    mock_results = {
        "indicator": "example.com",
        "ioc_type": "domain",
        "results": {
            "virustotal": {
                "status": "success",
                "malicious_count": 5,
                "total_count": 70
            },
            "abuseipdb": {
                "status": "success",
                "abuse_confidence": 75
            },
            "otx": {
                "status": "success",
                "pulse_count": 25,
                "reputation": -30
            }
        }
    }
    
    # Analyze results
    analysis = engine.analyze_results(mock_results)
    
    print(f"   Verdict: {analysis['verdict']}")
    print(f"   Threat Score: {analysis['threat_score']:.1f}/100")
    print(f"   Confidence: {analysis['confidence_score']:.1%}")
    print(f"   Evidence Count: {len(analysis['evidence'])}")
    print(f"   Tags: {', '.join(analysis['tags'])}")
    print(f"   Summary: {analysis['analysis_summary']}")

async def test_threat_intel_service():
    """Test threat intelligence service (without API keys)"""
    print("\n🧪 Testing Threat Intelligence Service...")
    
    try:
        from app.services.threat_intel import ThreatIntelService
        
        service = ThreatIntelService()
        api_keys = service.api_keys
        
        if api_keys:
            print(f"   ✅ Available services: {', '.join(api_keys.keys())}")
        else:
            print("   ⚠️  No API keys configured")
            print("   Set environment variables for threat intelligence services")
        
        await service.close()
        
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")

def main():
    """Run all tests"""
    print("🚀 Threat IOC Analysis Tool - Basic Tests")
    print("=" * 50)
    
    # Test IOC parser
    test_ioc_parser()
    
    # Test analysis engine
    test_analysis_engine()
    
    # Test threat intel service
    asyncio.run(test_threat_intel_service())
    
    print("\n✅ Basic tests completed!")
    print("\nTo run the full application:")
    print("1. Copy env.example to .env and add your API keys")
    print("2. Run: uvicorn main:app --reload")
    print("3. Or test with CLI: python cli.py 'example.com'")

if __name__ == "__main__":
    main()
