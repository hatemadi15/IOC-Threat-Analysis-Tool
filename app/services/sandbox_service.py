import asyncio
import docker
import tempfile
import os
import json
import subprocess
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import uuid
import shutil
import requests

class SandboxService:
    """Service for managing sandbox analysis environments"""
    
    def __init__(self):
        self.docker_client = None
        self.active_containers = {}
        self.analysis_queue = {}
        self.supported_environments = {
            "windows10": {
                "image": "threatanalysis/windows10-sandbox:latest",
                "platform": "windows",
                "timeout": 300
            },
            "windows11": {
                "image": "threatanalysis/windows11-sandbox:latest", 
                "platform": "windows",
                "timeout": 300
            },
            "ubuntu20": {
                "image": "threatanalysis/ubuntu20-sandbox:latest",
                "platform": "linux",
                "timeout": 300
            },
            "ubuntu22": {
                "image": "threatanalysis/ubuntu22-sandbox:latest",
                "platform": "linux", 
                "timeout": 300
            }
        }
        
    async def initialize_docker(self):
        """Initialize Docker client"""
        try:
            self.docker_client = docker.from_env()
            return True
        except Exception as e:
            print(f"Failed to initialize Docker: {e}")
            return False
    
    async def deploy_local_sandbox(self, environment: str = "ubuntu20") -> Dict[str, Any]:
        """Deploy a local containerized sandbox environment"""
        try:
            if not self.docker_client:
                await self.initialize_docker()
            
            if environment not in self.supported_environments:
                raise ValueError(f"Unsupported environment: {environment}")
            
            env_config = self.supported_environments[environment]
            container_name = f"sandbox-{environment}-{uuid.uuid4().hex[:8]}"
            
            # Check if image exists, pull if necessary
            try:
                self.docker_client.images.get(env_config["image"])
            except docker.errors.ImageNotFound:
                print(f"Pulling sandbox image: {env_config['image']}")
                # For demo purposes, we'll create a basic container
                # In production, you'd pull from a registry
                container = self.docker_client.containers.run(
                    "ubuntu:20.04",
                    name=container_name,
                    detach=True,
                    network_mode="none",  # Isolated network
                    mem_limit="2g",
                    cpu_count=2,
                    security_opt=["no-new-privileges"],
                    cap_drop=["ALL"],
                    read_only=True,
                    tmpfs={'/tmp': 'noexec,nosuid,size=100m'},
                    command="sleep 3600"  # Keep container alive
                )
            
            # Store container reference
            self.active_containers[container_name] = {
                "container": container,
                "environment": environment,
                "created_at": datetime.utcnow(),
                "status": "running"
            }
            
            return {
                "container_id": container_name,
                "environment": environment,
                "status": "deployed",
                "created_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                "error": str(e),
                "status": "failed"
            }
    
    async def submit_file_to_sandbox(
        self, 
        file_path: str, 
        filename: str,
        environment: str = "ubuntu20",
        timeout: int = 300
    ) -> Dict[str, Any]:
        """Submit a file for sandbox analysis"""
        try:
            analysis_id = str(uuid.uuid4())
            
            # Create analysis record
            analysis_record = {
                "id": analysis_id,
                "filename": filename,
                "environment": environment,
                "status": "queued",
                "submitted_at": datetime.utcnow().isoformat(),
                "timeout": timeout,
                "results": {}
            }
            
            self.analysis_queue[analysis_id] = analysis_record
            
            # Start analysis in background
            asyncio.create_task(self._run_sandbox_analysis(analysis_id, file_path))
            
            return {
                "analysis_id": analysis_id,
                "status": "queued",
                "message": "File submitted for sandbox analysis"
            }
            
        except Exception as e:
            return {
                "error": str(e),
                "status": "failed"
            }
    
    async def _run_sandbox_analysis(self, analysis_id: str, file_path: str):
        """Run the actual sandbox analysis"""
        try:
            analysis = self.analysis_queue[analysis_id]
            analysis["status"] = "running"
            analysis["started_at"] = datetime.utcnow().isoformat()
            
            environment = analysis["environment"]
            
            # Deploy sandbox if needed
            if environment not in [c["environment"] for c in self.active_containers.values()]:
                deploy_result = await self.deploy_local_sandbox(environment)
                if "error" in deploy_result:
                    analysis["status"] = "failed"
                    analysis["error"] = deploy_result["error"]
                    return
            
            # Simulate sandbox analysis
            await asyncio.sleep(5)  # Simulate analysis time
            
            # Mock analysis results
            analysis_results = self._generate_mock_analysis_results(analysis["filename"])
            
            analysis.update({
                "status": "completed",
                "completed_at": datetime.utcnow().isoformat(),
                "results": analysis_results
            })
            
        except Exception as e:
            analysis["status"] = "failed"
            analysis["error"] = str(e)
            analysis["failed_at"] = datetime.utcnow().isoformat()
    
    def _generate_mock_analysis_results(self, filename: str) -> Dict[str, Any]:
        """Generate mock sandbox analysis results"""
        # Simulate different analysis outcomes based on filename
        is_suspicious = any(keyword in filename.lower() for keyword in 
                          ['malware', 'virus', 'trojan', 'suspicious', 'hack'])
        
        if is_suspicious:
            return {
                "threat_level": "HIGH",
                "behavior": [
                    "File attempts to modify system registry",
                    "Establishes network connections to suspicious IPs",
                    "Creates additional files in system directories",
                    "Attempts to disable Windows Defender",
                    "Injects code into running processes"
                ],
                "network_activity": [
                    {"ip": "185.159.158.21", "port": 443, "protocol": "HTTPS"},
                    {"ip": "91.205.230.66", "port": 80, "protocol": "HTTP"}
                ],
                "file_operations": [
                    {"action": "create", "path": "C:\\Windows\\Temp\\update.exe"},
                    {"action": "modify", "path": "C:\\Windows\\System32\\drivers\\etc\\hosts"},
                    {"action": "delete", "path": "C:\\Users\\User\\Desktop\\important.txt"}
                ],
                "registry_changes": [
                    {"action": "create", "key": "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run\\Malware"},
                    {"action": "modify", "key": "HKLM\\SYSTEM\\CurrentControlSet\\Services\\SharedAccess\\Parameters\\FirewallPolicy"}
                ],
                "processes_created": [
                    {"name": "svchost.exe", "pid": 1234, "parent": "explorer.exe"},
                    {"name": "update.exe", "pid": 5678, "parent": "svchost.exe"}
                ],
                "screenshots": [
                    {"timestamp": "2024-01-01T12:00:00Z", "description": "Desktop after execution"},
                    {"timestamp": "2024-01-01T12:02:30Z", "description": "Warning dialog displayed"}
                ],
                "memory_analysis": {
                    "suspicious_strings": ["http://malicious-c2.com", "keylogger", "password"],
                    "injected_code": True,
                    "packed": True
                }
            }
        else:
            return {
                "threat_level": "LOW",
                "behavior": [
                    "File executed normally without suspicious activity",
                    "No network connections established",
                    "No system modifications detected"
                ],
                "network_activity": [],
                "file_operations": [
                    {"action": "read", "path": "/home/user/document.txt"}
                ],
                "registry_changes": [],
                "processes_created": [],
                "screenshots": [
                    {"timestamp": "2024-01-01T12:00:00Z", "description": "Normal execution"}
                ],
                "memory_analysis": {
                    "suspicious_strings": [],
                    "injected_code": False,
                    "packed": False
                }
            }
    
    async def get_analysis_status(self, analysis_id: str) -> Dict[str, Any]:
        """Get the status of a sandbox analysis"""
        if analysis_id not in self.analysis_queue:
            return {"error": "Analysis not found", "status": "not_found"}
        
        return self.analysis_queue[analysis_id]
    
    async def get_analysis_results(self, analysis_id: str) -> Dict[str, Any]:
        """Get detailed results of a completed sandbox analysis"""
        if analysis_id not in self.analysis_queue:
            return {"error": "Analysis not found"}
        
        analysis = self.analysis_queue[analysis_id]
        
        if analysis["status"] != "completed":
            return {
                "error": "Analysis not completed",
                "status": analysis["status"]
            }
        
        return analysis["results"]
    
    async def stop_analysis(self, analysis_id: str) -> Dict[str, Any]:
        """Stop a running sandbox analysis"""
        if analysis_id not in self.analysis_queue:
            return {"error": "Analysis not found"}
        
        analysis = self.analysis_queue[analysis_id]
        
        if analysis["status"] in ["queued", "running"]:
            analysis["status"] = "stopped"
            analysis["stopped_at"] = datetime.utcnow().isoformat()
            return {"message": "Analysis stopped", "status": "stopped"}
        
        return {"error": "Analysis cannot be stopped", "status": analysis["status"]}
    
    async def list_active_containers(self) -> List[Dict[str, Any]]:
        """List all active sandbox containers"""
        containers = []
        
        for container_id, container_info in self.active_containers.items():
            containers.append({
                "container_id": container_id,
                "environment": container_info["environment"],
                "status": container_info["status"],
                "created_at": container_info["created_at"].isoformat(),
                "uptime": str(datetime.utcnow() - container_info["created_at"])
            })
        
        return containers
    
    async def cleanup_containers(self):
        """Clean up old and unused containers"""
        current_time = datetime.utcnow()
        containers_to_remove = []
        
        for container_id, container_info in self.active_containers.items():
            # Remove containers older than 1 hour
            if current_time - container_info["created_at"] > timedelta(hours=1):
                containers_to_remove.append(container_id)
        
        for container_id in containers_to_remove:
            try:
                container_info = self.active_containers[container_id]
                container = container_info["container"]
                container.stop()
                container.remove()
                del self.active_containers[container_id]
                print(f"Cleaned up container: {container_id}")
            except Exception as e:
                print(f"Failed to cleanup container {container_id}: {e}")
    
    async def get_sandbox_stats(self) -> Dict[str, Any]:
        """Get sandbox service statistics"""
        total_analyses = len(self.analysis_queue)
        completed = sum(1 for a in self.analysis_queue.values() if a["status"] == "completed")
        running = sum(1 for a in self.analysis_queue.values() if a["status"] == "running")
        queued = sum(1 for a in self.analysis_queue.values() if a["status"] == "queued")
        failed = sum(1 for a in self.analysis_queue.values() if a["status"] == "failed")
        
        return {
            "total_analyses": total_analyses,
            "completed": completed,
            "running": running,
            "queued": queued,
            "failed": failed,
            "active_containers": len(self.active_containers),
            "supported_environments": list(self.supported_environments.keys())
        }

# Cloud sandbox integrations
class CloudSandboxService:
    """Service for integrating with cloud sandbox providers"""
    
    def __init__(self):
        self.providers = {
            "hybrid_analysis": {
                "name": "Hybrid Analysis",
                "api_url": "https://www.hybrid-analysis.com/api/v2",
                "supported_formats": ["pe", "pdf", "office", "android"]
            },
            "joe_sandbox": {
                "name": "Joe Sandbox Cloud",
                "api_url": "https://jbxcloud.joesecurity.org/api/v2",
                "supported_formats": ["pe", "pdf", "office", "android", "ios"]
            },
            "cuckoo_sandbox": {
                "name": "Cuckoo Sandbox",
                "api_url": "http://localhost:8090/api",
                "supported_formats": ["pe", "pdf", "office"]
            }
        }
    
    async def submit_to_cloud_sandbox(
        self, 
        file_path: str, 
        provider: str = "hybrid_analysis"
    ) -> Dict[str, Any]:
        """Submit file to cloud sandbox provider"""
        if provider not in self.providers:
            return {"error": f"Unsupported provider: {provider}"}
        
        # Mock cloud sandbox submission
        submission_id = str(uuid.uuid4())
        
        return {
            "submission_id": submission_id,
            "provider": provider,
            "status": "submitted",
            "estimated_completion": (datetime.utcnow() + timedelta(minutes=10)).isoformat()
        }
    
    async def get_cloud_results(self, submission_id: str, provider: str) -> Dict[str, Any]:
        """Get results from cloud sandbox"""
        # Mock cloud sandbox results
        return {
            "submission_id": submission_id,
            "provider": provider,
            "status": "completed",
            "threat_score": 85,
            "verdict": "malicious",
            "analysis_url": f"https://{provider}.com/reports/{submission_id}"
        }
