from typing import Dict, Any, List, Tuple
from app.models.ioc import Verdict, IOCType
import math

class AnalysisEngine:
    """Engine for analyzing threat intelligence data and generating verdicts"""
    
    def __init__(self):
        # Weight configuration for different threat intelligence sources
        self.source_weights = {
            "virustotal": 0.4,      # High weight due to comprehensive coverage
            "abuseipdb": 0.25,      # Good for IP/domain reputation
            "otx": 0.2,             # Community-driven intelligence
            "urlscan": 0.15         # Web-based threats
        }
        
        # Thresholds for different verdicts
        self.thresholds = {
            "malicious": 0.7,       # 70% confidence for malicious
            "suspicious": 0.4,      # 40% confidence for suspicious
            "benign": 0.8           # 80% confidence for benign
        }
    
    def analyze_results(self, threat_intel_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze threat intelligence results and generate a verdict
        
        Args:
            threat_intel_results: Results from threat intelligence services
            
        Returns:
            Analysis results with verdict and confidence score
        """
        if not threat_intel_results or "results" not in threat_intel_results:
            return {
                "verdict": Verdict.UNKNOWN,
                "confidence_score": 0.0,
                "threat_score": 0.0,
                "evidence": [],
                "tags": [],
                "analysis_summary": "No threat intelligence data available"
            }
        
        # Extract individual service results
        service_results = threat_intel_results["results"]
        
        # Calculate threat scores for each service
        service_scores = {}
        evidence = []
        tags = []
        
        for service_name, result in service_results.items():
            if result.get("status") == "success":
                score, service_evidence, service_tags = self._calculate_service_score(
                    service_name, result, threat_intel_results["ioc_type"]
                )
                service_scores[service_name] = score
                evidence.extend(service_evidence)
                tags.extend(service_tags)
        
        # Calculate weighted threat score
        threat_score = self._calculate_weighted_threat_score(service_scores)
        
        # Calculate confidence score
        confidence_score = self._calculate_confidence_score(service_scores, service_results)
        
        # Determine verdict
        verdict = self._determine_verdict(threat_score, confidence_score)
        
        # Generate analysis summary
        analysis_summary = self._generate_analysis_summary(
            verdict, threat_score, confidence_score, service_results
        )
        
        return {
            "verdict": verdict,
            "confidence_score": confidence_score,
            "threat_score": threat_score,
            "evidence": evidence,
            "tags": list(set(tags)),  # Remove duplicates
            "analysis_summary": analysis_summary,
            "service_scores": service_scores
        }
    
    def _calculate_service_score(self, service_name: str, result: Dict[str, Any], ioc_type: str) -> Tuple[float, List[Dict], List[str]]:
        """Calculate threat score for a specific service"""
        score = 0.0
        evidence = []
        tags = []
        
        if service_name == "virustotal":
            score, evidence, tags = self._calculate_virustotal_score(result, ioc_type)
        elif service_name == "abuseipdb":
            score, evidence, tags = self._calculate_abuseipdb_score(result, ioc_type)
        elif service_name == "otx":
            score, evidence, tags = self._calculate_otx_score(result, ioc_type)
        elif service_name == "urlscan":
            score, evidence, tags = self._calculate_urlscan_score(result, ioc_type)
        
        return score, evidence, tags
    
    def _calculate_virustotal_score(self, result: Dict[str, Any], ioc_type: str) -> Tuple[float, List[Dict], List[str]]:
        """Calculate threat score from VirusTotal results"""
        score = 0.0
        evidence = []
        tags = []
        
        data = result.get("data", {})
        malicious_count = result.get("malicious_count", 0)
        total_count = result.get("total_count", 0)
        
        if total_count > 0:
            # Calculate percentage of malicious detections
            malicious_percentage = malicious_count / total_count
            
            # Score based on malicious percentage
            if malicious_percentage > 0.5:
                score = 80.0 + (malicious_percentage - 0.5) * 40.0  # 80-100
                tags.append("high_malware_detection")
            elif malicious_percentage > 0.2:
                score = 40.0 + (malicious_percentage - 0.2) * 133.0  # 40-80
                tags.append("moderate_malware_detection")
            elif malicious_percentage > 0:
                score = malicious_percentage * 200.0  # 0-40
                tags.append("low_malware_detection")
            else:
                score = 0.0
                tags.append("clean")
            
            evidence.append({
                "source": "virustotal",
                "type": "malware_detection",
                "value": f"{malicious_count}/{total_count} engines detected malware",
                "confidence": "high"
            })
        
        return min(score, 100.0), evidence, tags
    
    def _calculate_abuseipdb_score(self, result: Dict[str, Any], ioc_type: str) -> Tuple[float, List[Dict], List[str]]:
        """Calculate threat score from AbuseIPDB results"""
        score = 0.0
        evidence = []
        tags = []
        
        data = result.get("data", {})
        abuse_confidence = result.get("abuse_confidence", 0)
        
        # Score based on abuse confidence
        if abuse_confidence > 80:
            score = 90.0 + (abuse_confidence - 80) * 0.5  # 90-100
            tags.append("high_abuse_confidence")
        elif abuse_confidence > 50:
            score = 60.0 + (abuse_confidence - 50) * 1.0  # 60-90
            tags.append("moderate_abuse_confidence")
        elif abuse_confidence > 20:
            score = 20.0 + (abuse_confidence - 20) * 1.33  # 20-60
            tags.append("low_abuse_confidence")
        else:
            score = abuse_confidence * 1.0  # 0-20
            tags.append("clean")
        
        # Additional factors
        if result.get("is_tor", False):
            score += 20.0
            tags.append("tor_exit_node")
            evidence.append({
                "source": "abuseipdb",
                "type": "network_anomaly",
                "value": "TOR exit node detected",
                "confidence": "high"
            })
        
        if result.get("is_vpn", False):
            score += 10.0
            tags.append("vpn_detected")
        
        if result.get("is_proxy", False):
            score += 15.0
            tags.append("proxy_detected")
        
        evidence.append({
            "source": "abuseipdb",
            "type": "reputation_score",
            "value": f"Abuse confidence: {abuse_confidence}%",
            "confidence": "medium"
        })
        
        return min(score, 100.0), evidence, tags
    
    def _calculate_otx_score(self, result: Dict[str, Any], ioc_type: str) -> Tuple[float, List[Dict], List[str]]:
        """Calculate threat score from OTX results"""
        score = 0.0
        evidence = []
        tags = []
        
        data = result.get("data", {})
        pulse_count = result.get("pulse_count", 0)
        reputation = result.get("reputation", 0)
        
        # Score based on pulse count (threat reports)
        if pulse_count > 100:
            score = 80.0 + min((pulse_count - 100) * 0.1, 20.0)  # 80-100
            tags.append("high_threat_activity")
        elif pulse_count > 50:
            score = 60.0 + (pulse_count - 50) * 0.4  # 60-80
            tags.append("moderate_threat_activity")
        elif pulse_count > 10:
            score = 30.0 + (pulse_count - 10) * 0.75  # 30-60
            tags.append("low_threat_activity")
        elif pulse_count > 0:
            score = pulse_count * 3.0  # 0-30
            tags.append("minimal_threat_activity")
        else:
            score = 0.0
            tags.append("clean")
        
        # Adjust score based on reputation
        if reputation < -50:
            score += 20.0
            tags.append("very_negative_reputation")
        elif reputation < 0:
            score += 10.0
            tags.append("negative_reputation")
        
        # Add tags from OTX
        otx_tags = result.get("tags", [])
        tags.extend([tag.lower().replace(" ", "_") for tag in otx_tags])
        
        evidence.append({
            "source": "otx",
            "type": "threat_activity",
            "value": f"{pulse_count} threat reports",
            "confidence": "medium"
        })
        
        return min(score, 100.0), evidence, tags
    
    def _calculate_urlscan_score(self, result: Dict[str, Any], ioc_type: str) -> Tuple[float, List[Dict], List[str]]:
        """Calculate threat score from URLScan results"""
        score = 0.0
        evidence = []
        tags = []
        
        scan_count = result.get("scan_count", 0)
        
        # Score based on scan count (more scans = more suspicious)
        if scan_count > 50:
            score = 70.0 + min((scan_count - 50) * 0.3, 30.0)  # 70-100
            tags.append("high_scan_activity")
        elif scan_count > 20:
            score = 40.0 + (scan_count - 20) * 1.0  # 40-70
            tags.append("moderate_scan_activity")
        elif scan_count > 5:
            score = 20.0 + (scan_count - 5) * 1.33  # 20-40
            tags.append("low_scan_activity")
        elif scan_count > 0:
            score = scan_count * 4.0  # 0-20
            tags.append("minimal_scan_activity")
        else:
            score = 0.0
            tags.append("no_scan_history")
        
        evidence.append({
            "source": "urlscan",
            "type": "scan_activity",
            "value": f"{scan_count} scans performed",
            "confidence": "medium"
        })
        
        return min(score, 100.0), evidence, tags
    
    def _calculate_weighted_threat_score(self, service_scores: Dict[str, float]) -> float:
        """Calculate weighted threat score across all services"""
        if not service_scores:
            return 0.0
        
        weighted_sum = 0.0
        total_weight = 0.0
        
        for service, score in service_scores.items():
            weight = self.source_weights.get(service, 0.1)
            weighted_sum += score * weight
            total_weight += weight
        
        if total_weight > 0:
            return weighted_sum / total_weight
        
        return 0.0
    
    def _calculate_confidence_score(self, service_scores: Dict[str, float], service_results: Dict[str, Any]) -> float:
        """Calculate confidence score based on available data quality"""
        if not service_scores:
            return 0.0
        
        # Base confidence on number of successful services
        successful_services = sum(1 for result in service_results.values() 
                                if result.get("status") == "success")
        total_services = len(service_results)
        
        if total_services == 0:
            return 0.0
        
        # Base confidence from service availability
        base_confidence = successful_services / total_services
        
        # Adjust confidence based on data quality
        quality_factors = []
        
        for service, result in service_results.items():
            if result.get("status") == "success":
                # Check if we have meaningful data
                if service == "virustotal" and result.get("total_count", 0) > 0:
                    quality_factors.append(1.0)
                elif service == "abuseipdb" and result.get("abuse_confidence") is not None:
                    quality_factors.append(1.0)
                elif service == "otx" and result.get("pulse_count") is not None:
                    quality_factors.append(1.0)
                elif service == "urlscan" and result.get("scan_count") is not None:
                    quality_factors.append(1.0)
                else:
                    quality_factors.append(0.5)
        
        if quality_factors:
            quality_score = sum(quality_factors) / len(quality_factors)
            confidence = (base_confidence + quality_score) / 2
        else:
            confidence = base_confidence
        
        return min(confidence, 1.0)
    
    def _determine_verdict(self, threat_score: float, confidence_score: float) -> Verdict:
        """Determine final verdict based on threat score and confidence"""
        if confidence_score < 0.3:
            return Verdict.UNKNOWN
        
        if threat_score >= self.thresholds["malicious"] * 100:
            return Verdict.MALICIOUS
        elif threat_score >= self.thresholds["suspicious"] * 100:
            return Verdict.SUSPICIOUS
        elif threat_score <= (1 - self.thresholds["benign"]) * 100:
            return Verdict.BENIGN
        else:
            return Verdict.UNKNOWN
    
    def _generate_analysis_summary(self, verdict: Verdict, threat_score: float, 
                                 confidence_score: float, service_results: Dict[str, Any]) -> str:
        """Generate human-readable analysis summary"""
        summary_parts = []
        
        # Add verdict
        summary_parts.append(f"Verdict: {verdict.value.upper()}")
        
        # Add threat score
        summary_parts.append(f"Threat Score: {threat_score:.1f}/100")
        
        # Add confidence
        summary_parts.append(f"Confidence: {confidence_score:.1%}")
        
        # Add service summary
        successful_services = [name for name, result in service_results.items() 
                             if result.get("status") == "success"]
        if successful_services:
            summary_parts.append(f"Sources: {', '.join(successful_services)}")
        
        # Add specific findings
        findings = []
        for service, result in service_results.items():
            if result.get("status") == "success":
                if service == "virustotal" and result.get("malicious_count", 0) > 0:
                    findings.append(f"{result['malicious_count']} AV engines detected malware")
                elif service == "abuseipdb" and result.get("abuse_confidence", 0) > 50:
                    findings.append(f"High abuse confidence ({result['abuse_confidence']}%)")
                elif service == "otx" and result.get("pulse_count", 0) > 50:
                    findings.append(f"{result['pulse_count']} threat reports")
        
        if findings:
            summary_parts.append(f"Key findings: {'; '.join(findings)}")
        
        return " | ".join(summary_parts)
