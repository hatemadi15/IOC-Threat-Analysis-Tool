#!/usr/bin/env python3
"""
Simple CLI interface for testing the Threat IOC Analysis Tool
"""

import asyncio
import sys
import json
from typing import List

from app.services.ioc_parser import IOCParser
from app.services.threat_intel import ThreatIntelService
from app.services.analysis_engine import AnalysisEngine

class IOCAnalyzerCLI:
    def __init__(self):
        self.ioc_parser = IOCParser()
        self.analysis_engine = AnalysisEngine()
    
    async def analyze_ioc(self, indicator: str, description: str = None) -> dict:
        """Analyze a single IOC"""
        print(f"\n🔍 Analyzing IOC: {indicator}")
        if description:
            print(f"📝 Description: {description}")
        
        # Parse and validate IOC
        print("📋 Parsing IOC...")
        ioc_type, is_valid, error_message = self.ioc_parser.parse_ioc(indicator)
        
        if not is_valid:
            print(f"❌ Error: {error_message}")
            return None
        
        print(f"✅ IOC Type: {ioc_type.value}")
        
        # Normalize IOC
        normalized_indicator = self.ioc_parser.normalize_ioc(indicator, ioc_type)
        print(f"🔄 Normalized: {normalized_indicator}")
        
        # Perform threat intelligence analysis
        print("🌐 Querying threat intelligence services...")
        threat_intel_service = ThreatIntelService()
        
        try:
            # Check available API keys
            api_keys = threat_intel_service.api_keys
            if not api_keys:
                print("⚠️  Warning: No API keys configured. Analysis will be limited.")
                print("   Set environment variables for: VIRUSTOTAL_API_KEY, ABUSEIPDB_API_KEY, etc.")
            else:
                print(f"🔑 Available services: {', '.join(api_keys.keys())}")
            
            # Query threat intelligence services
            threat_intel_results = await threat_intel_service.analyze_ioc(
                normalized_indicator, ioc_type.value
            )
            
            # Analyze results and generate verdict
            print("🧠 Analyzing results...")
            analysis_results = self.analysis_engine.analyze_results(threat_intel_results)
            
            # Display results
            self._display_results(analysis_results, threat_intel_results)
            
            return {
                "indicator": normalized_indicator,
                "ioc_type": ioc_type.value,
                "analysis": analysis_results,
                "threat_intel": threat_intel_results
            }
            
        except Exception as e:
            print(f"❌ Analysis failed: {str(e)}")
            return None
        
        finally:
            await threat_intel_service.close()
    
    def _display_results(self, analysis_results: dict, threat_intel_results: dict):
        """Display analysis results in a formatted way"""
        print("\n" + "="*60)
        print("🎯 ANALYSIS RESULTS")
        print("="*60)
        
        # Verdict and scores
        verdict = analysis_results.get("verdict", "UNKNOWN")
        threat_score = analysis_results.get("threat_score", 0)
        confidence_score = analysis_results.get("confidence_score", 0)
        
        # Color-coded verdict
        if verdict == "MALICIOUS":
            verdict_emoji = "🚨"
        elif verdict == "SUSPICIOUS":
            verdict_emoji = "⚠️"
        elif verdict == "BENIGN":
            verdict_emoji = "✅"
        else:
            verdict_emoji = "❓"
        
        print(f"{verdict_emoji} Verdict: {verdict.upper()}")
        print(f"📊 Threat Score: {threat_score:.1f}/100")
        print(f"🎯 Confidence: {confidence_score:.1%}")
        
        # Analysis summary
        summary = analysis_results.get("analysis_summary", "")
        if summary:
            print(f"\n📋 Summary: {summary}")
        
        # Evidence
        evidence = analysis_results.get("evidence", [])
        if evidence:
            print(f"\n🔍 Evidence ({len(evidence)} items):")
            for i, item in enumerate(evidence, 1):
                source = item.get("source", "unknown")
                evidence_type = item.get("type", "unknown")
                value = item.get("value", "unknown")
                confidence = item.get("confidence", "unknown")
                print(f"   {i}. [{source.upper()}] {evidence_type}: {value} (confidence: {confidence})")
        
        # Tags
        tags = analysis_results.get("tags", [])
        if tags:
            print(f"\n🏷️  Tags: {', '.join(tags)}")
        
        # Service results
        service_results = threat_intel_results.get("results", {})
        if service_results:
            print(f"\n🌐 Threat Intelligence Results:")
            for service_name, result in service_results.items():
                status = result.get("status", "unknown")
                if status == "success":
                    print(f"   ✅ {service_name.upper()}: Success")
                    # Show key metrics
                    if service_name == "virustotal":
                        malicious = result.get("malicious_count", 0)
                        total = result.get("total_count", 0)
                        if total > 0:
                            print(f"      🦠 {malicious}/{total} engines detected malware")
                    elif service_name == "abuseipdb":
                        abuse_score = result.get("abuse_confidence", 0)
                        print(f"      🚫 Abuse confidence: {abuse_score}%")
                    elif service_name == "otx":
                        pulse_count = result.get("pulse_count", 0)
                        print(f"      📰 {pulse_count} threat reports")
                    elif service_name == "urlscan":
                        scan_count = result.get("scan_count", 0)
                        print(f"      🔍 {scan_count} scans performed")
                else:
                    print(f"   ❌ {service_name.upper()}: {status}")
                    if "error" in result:
                        print(f"      Error: {result['error']}")
        
        print("="*60)
    
    async def analyze_batch(self, indicators: List[str]):
        """Analyze multiple IOCs in batch"""
        print(f"\n🚀 Starting batch analysis of {len(indicators)} IOCs...")
        
        results = []
        failed = []
        
        for i, indicator in enumerate(indicators, 1):
            print(f"\n[{i}/{len(indicators)}] Processing: {indicator}")
            
            try:
                result = await self.analyze_ioc(indicator)
                if result:
                    results.append(result)
                else:
                    failed.append(indicator)
            except Exception as e:
                print(f"❌ Failed to analyze {indicator}: {str(e)}")
                failed.append(indicator)
        
        # Summary
        print(f"\n📊 BATCH ANALYSIS SUMMARY")
        print(f"✅ Successful: {len(results)}")
        print(f"❌ Failed: {len(failed)}")
        
        if failed:
            print(f"\nFailed indicators:")
            for indicator in failed:
                print(f"   - {indicator}")
        
        return results, failed

def main():
    """Main CLI function"""
    if len(sys.argv) < 2:
        print("Usage: python cli.py <indicator> [description]")
        print("   or: python cli.py --batch <indicator1> <indicator2> ...")
        print("\nExamples:")
        print("  python cli.py 'https://example.com' 'Suspicious URL'")
        print("  python cli.py '192.168.1.1' 'Internal IP'")
        print("  python cli.py 'd41d8cd98f00b204e9800998ecf8427e' 'MD5 hash'")
        print("  python cli.py --batch 'example.com' 'test@example.com' '8.8.8.8'")
        sys.exit(1)
    
    cli = IOCAnalyzerCLI()
    
    if sys.argv[1] == "--batch":
        if len(sys.argv) < 3:
            print("Error: --batch requires at least one indicator")
            sys.exit(1)
        
        indicators = sys.argv[2:]
        asyncio.run(cli.analyze_batch(indicators))
    else:
        indicator = sys.argv[1]
        description = sys.argv[2] if len(sys.argv) > 2 else None
        
        asyncio.run(cli.analyze_ioc(indicator, description))

if __name__ == "__main__":
    main()
