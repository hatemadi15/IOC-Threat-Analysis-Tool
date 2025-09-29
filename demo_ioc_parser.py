#!/usr/bin/env python3
"""
Demo script showing how the IOC Parser works
"""

from app.services.ioc_parser import IOCParser

def demo_ioc_parsing():
    """Demonstrate IOC parsing capabilities"""
    print("🔍 IOC Parser Demo")
    print("=" * 50)
    
    parser = IOCParser()
    
    # Test different types of IOCs
    test_cases = [
        "https://malware.example.com/payload.exe",
        "192.168.1.100",
        "malicious-domain.com",
        "d41d8cd98f00b204e9800998ecf8427e",
        "test@phishing-site.com",
        "8.8.8.8",
        "google.com"
    ]
    
    for indicator in test_cases:
        print(f"\n📋 Analyzing: {indicator}")
        
        # Parse the IOC
        ioc_type, is_valid, error_message = parser.parse_ioc(indicator)
        
        if is_valid:
            print(f"   ✅ Type: {ioc_type.value}")
            
            # Normalize the IOC
            normalized = parser.normalize_ioc(indicator, ioc_type)
            print(f"   🔄 Normalized: {normalized}")
            
            # Validate the IOC
            is_valid_after, validation_error = parser.validate_ioc(normalized, ioc_type)
            print(f"   🎯 Validation: {'Pass' if is_valid_after else 'Fail'}")
            
        else:
            print(f"   ❌ Error: {error_message}")

def demo_analysis_engine():
    """Demonstrate the analysis engine with mock data"""
    print("\n\n🧠 Analysis Engine Demo")
    print("=" * 50)
    
    from app.services.analysis_engine import AnalysisEngine
    
    engine = AnalysisEngine()
    
    # Mock threat intelligence results
    mock_results = {
        "indicator": "malware.example.com",
        "ioc_type": "domain",
        "results": {
            "virustotal": {
                "status": "success",
                "malicious_count": 15,
                "total_count": 70
            },
            "abuseipdb": {
                "status": "success",
                "abuse_confidence": 85
            },
            "otx": {
                "status": "success",
                "pulse_count": 45,
                "reputation": -60
            }
        }
    }
    
    # Analyze the results
    analysis = engine.analyze_results(mock_results)
    
    print(f"🎯 Final Verdict: {analysis['verdict']}")
    print(f"📊 Threat Score: {analysis['threat_score']:.1f}/100")
    print(f"🎯 Confidence: {analysis['confidence_score']:.1%}")
    print(f"🔍 Evidence Count: {len(analysis['evidence'])}")
    print(f"🏷️  Tags: {', '.join(analysis['tags'])}")
    print(f"📋 Summary: {analysis['analysis_summary']}")

def main():
    """Run the demo"""
    print("🚀 Threat IOC Analysis Tool - Demo")
    print("This shows how the tool parses and analyzes IOCs")
    
    # Demo IOC parsing
    demo_ioc_parsing()
    
    # Demo analysis engine
    demo_analysis_engine()
    
    print("\n\n🎉 Demo completed!")
    print("\nTo use this tool with real threat intelligence:")
    print("1. Get API keys from VirusTotal, AbuseIPDB, etc.")
    print("2. Set them in a .env file")
    print("3. Run: python cli.py 'suspicious-domain.com'")
    print("4. Or start the API server: uvicorn main:app --reload")

if __name__ == "__main__":
    main()
