import httpx
import asyncio
from typing import Dict, Any, Optional, List
from app.core.config import settings
import os
from datetime import datetime

class ThreatIntelService:
    """Service for querying various threat intelligence APIs"""
    
    def __init__(self):
        self.api_keys = self._load_api_keys()
        self.client = httpx.AsyncClient(timeout=30.0)
    
    def _load_api_keys(self) -> Dict[str, str]:
        """Load API keys from environment variables"""
        keys = {}
        
        # VirusTotal
        vt_key = os.getenv("VIRUSTOTAL_API_KEY")
        if vt_key:
            keys["virustotal"] = vt_key
        
        # AbuseIPDB
        abuse_key = os.getenv("ABUSEIPDB_API_KEY")
        if abuse_key:
            keys["abuseipdb"] = abuse_key
        
        # URLScan.io
        urlscan_key = os.getenv("URLSCAN_API_KEY")
        if urlscan_key:
            keys["urlscan"] = urlscan_key
        
        # AlienVault OTX
        otx_key = os.getenv("OTX_API_KEY")
        if otx_key:
            keys["otx"] = otx_key
        
        return keys
    
    async def analyze_ioc(self, indicator: str, ioc_type: str) -> Dict[str, Any]:
        """
        Analyze an IOC using available threat intelligence services
        
        Args:
            indicator: The IOC to analyze
            ioc_type: The type of IOC
            
        Returns:
            Dictionary containing analysis results from all services
        """
        results = {
            "indicator": indicator,
            "ioc_type": ioc_type,
            "analysis_time": datetime.utcnow().isoformat(),
            "services_queried": [],
            "results": {}
        }
        
        # Query available services concurrently
        tasks = []
        
        if "virustotal" in self.api_keys:
            tasks.append(self._query_virustotal(indicator, ioc_type))
        
        if "abuseipdb" in self.api_keys and ioc_type in ["ip_address", "domain"]:
            tasks.append(self._query_abuseipdb(indicator, ioc_type))
        
        if "urlscan" in self.api_keys and ioc_type in ["url", "domain"]:
            tasks.append(self._query_urlscan(indicator, ioc_type))
        
        if "otx" in self.api_keys:
            tasks.append(self._query_otx(indicator, ioc_type))
        
        # Execute all queries concurrently
        if tasks:
            service_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for i, result in enumerate(service_results):
                if isinstance(result, Exception):
                    results["results"][f"service_{i}"] = {
                        "error": str(result),
                        "status": "failed"
                    }
                else:
                    results["results"].update(result)
        
        results["services_queried"] = list(results["results"].keys())
        return results
    
    async def _query_virustotal(self, indicator: str, ioc_type: str) -> Dict[str, Any]:
        """Query VirusTotal API"""
        try:
            api_key = self.api_keys["virustotal"]
            
            # Determine endpoint based on IOC type
            if ioc_type in ["hash_md5", "hash_sha1", "hash_sha256"]:
                endpoint = f"https://www.virustotal.com/vtapi/v2/file/report"
                params = {"apikey": api_key, "resource": indicator}
            elif ioc_type == "url":
                endpoint = f"https://www.virustotal.com/vtapi/v2/url/report"
                params = {"apikey": api_key, "url": indicator}
            elif ioc_type == "domain":
                endpoint = f"https://www.virustotal.com/vtapi/v2/domain/report"
                params = {"apikey": api_key, "domain": indicator}
            elif ioc_type == "ip_address":
                endpoint = f"https://www.virustotal.com/vtapi/v2/ip-address/report"
                params = {"apikey": api_key, "ip": indicator}
            else:
                return {"virustotal": {"error": f"Unsupported IOC type: {ioc_type}"}}
            
            response = await self.client.get(endpoint, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            # Process VirusTotal response
            if data.get("response_code") == 1:
                return {
                    "virustotal": {
                        "status": "success",
                        "data": data,
                        "malicious_count": data.get("positives", 0),
                        "total_count": data.get("total", 0),
                        "scan_date": data.get("scan_date"),
                        "permalink": data.get("permalink")
                    }
                }
            else:
                return {
                    "virustotal": {
                        "status": "not_found",
                        "message": data.get("verbose_msg", "Indicator not found in VirusTotal")
                    }
                }
                
        except Exception as e:
            return {"virustotal": {"error": str(e), "status": "failed"}}
    
    async def _query_abuseipdb(self, indicator: str, ioc_type: str) -> Dict[str, Any]:
        """Query AbuseIPDB API"""
        try:
            api_key = self.api_keys["abuseipdb"]
            
            if ioc_type == "ip_address":
                endpoint = "https://api.abuseipdb.com/api/v2/check"
                params = {"ipAddress": indicator, "maxAgeInDays": "90"}
                headers = {"Key": api_key, "Accept": "application/json"}
                
                response = await self.client.get(endpoint, params=params, headers=headers)
                response.raise_for_status()
                
                data = response.json()
                
                if data.get("data"):
                    abuse_data = data["data"]
                    return {
                        "abuseipdb": {
                            "status": "success",
                            "data": abuse_data,
                            "abuse_confidence": abuse_data.get("abuseConfidenceScore", 0),
                            "country_code": abuse_data.get("countryCode"),
                            "usage_type": abuse_data.get("usageType"),
                            "is_public": abuse_data.get("isPublic", False),
                            "is_tor": abuse_data.get("isTor", False),
                            "is_vpn": abuse_data.get("isVpn", False),
                            "is_proxy": abuse_data.get("isProxy", False)
                        }
                    }
                else:
                    return {"abuseipdb": {"error": "No data returned", "status": "failed"}}
            
            elif ioc_type == "domain":
                endpoint = "https://api.abuseipdb.com/api/v2/check-block"
                params = {"network": indicator, "maxAgeInDays": "90"}
                headers = {"Key": api_key, "Accept": "application/json"}
                
                response = await self.client.get(endpoint, params=params, headers=headers)
                response.raise_for_status()
                
                data = response.json()
                
                if data.get("data"):
                    return {
                        "abuseipdb": {
                            "status": "success",
                            "data": data["data"],
                            "abuse_confidence": data["data"].get("abuseConfidenceScore", 0)
                        }
                    }
                else:
                    return {"abuseipdb": {"error": "No data returned", "status": "failed"}}
            
            else:
                return {"abuseipdb": {"error": f"Unsupported IOC type: {ioc_type}"}}
                
        except Exception as e:
            return {"abuseipdb": {"error": str(e), "status": "failed"}}
    
    async def _query_urlscan(self, indicator: str, ioc_type: str) -> Dict[str, Any]:
        """Query URLScan.io API"""
        try:
            api_key = self.api_keys.get("urlscan")
            
            if ioc_type == "url":
                # For URLs, we can search for recent scans
                endpoint = "https://urlscan.io/api/v1/search/"
                params = {"q": f"url:\"{indicator}\"", "size": 10}
                
                if api_key:
                    headers = {"API-Key": api_key}
                else:
                    headers = {}
                
                response = await self.client.get(endpoint, params=params, headers=headers)
                response.raise_for_status()
                
                data = response.json()
                
                if data.get("results"):
                    return {
                        "urlscan": {
                            "status": "success",
                            "data": data,
                            "scan_count": len(data["results"]),
                            "latest_scan": data["results"][0].get("page", {}).get("domain"),
                            "results": data["results"][:5]  # Limit to 5 most recent
                        }
                    }
                else:
                    return {"urlscan": {"status": "not_found", "message": "No scans found for this URL"}}
            
            elif ioc_type == "domain":
                # For domains, search for recent scans
                endpoint = "https://urlscan.io/api/v1/search/"
                params = {"q": f"domain:\"{indicator}\"", "size": 10}
                
                if api_key:
                    headers = {"API-Key": api_key}
                else:
                    headers = {}
                
                response = await self.client.get(endpoint, params=params, headers=headers)
                response.raise_for_status()
                
                data = response.json()
                
                if data.get("results"):
                    return {
                        "urlscan": {
                            "status": "success",
                            "data": data,
                            "scan_count": len(data["results"]),
                            "latest_scan": data["results"][0].get("page", {}).get("domain"),
                            "results": data["results"][:5]
                        }
                    }
                else:
                    return {"urlscan": {"status": "not_found", "message": "No scans found for this domain"}}
            
            else:
                return {"urlscan": {"error": f"Unsupported IOC type: {ioc_type}"}}
                
        except Exception as e:
            return {"urlscan": {"error": str(e), "status": "failed"}}
    
    async def _query_otx(self, indicator: str, ioc_type: str) -> Dict[str, Any]:
        """Query AlienVault OTX API"""
        try:
            api_key = self.api_keys["otx"]
            
            # Determine endpoint based on IOC type
            if ioc_type in ["hash_md5", "hash_sha1", "hash_sha256"]:
                endpoint = f"https://otx.alienvault.com/api/v1/indicators/file/{indicator}/general"
            elif ioc_type == "url":
                endpoint = f"https://otx.alienvault.com/api/v1/indicators/url/{indicator}/general"
            elif ioc_type == "domain":
                endpoint = f"https://otx.alienvault.com/api/v1/indicators/domain/{indicator}/general"
            elif ioc_type == "ip_address":
                endpoint = f"https://otx.alienvault.com/api/v1/indicators/IPv4/{indicator}/general"
            else:
                return {"otx": {"error": f"Unsupported IOC type: {ioc_type}"}}
            
            headers = {"X-OTX-API-KEY": api_key}
            response = await self.client.get(endpoint, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            
            if data:
                return {
                    "otx": {
                        "status": "success",
                        "data": data,
                        "pulse_count": data.get("pulse_info", {}).get("count", 0),
                        "reputation": data.get("reputation", 0),
                        "country": data.get("country_name"),
                        "city": data.get("city"),
                        "tags": data.get("tags", [])
                    }
                }
            else:
                return {"otx": {"error": "No data returned", "status": "failed"}}
                
        except Exception as e:
            return {"otx": {"error": str(e), "status": "failed"}}
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
