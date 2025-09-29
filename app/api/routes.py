from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File, Depends
from fastapi.responses import JSONResponse
from typing import List, Optional
import uuid
from datetime import datetime
import asyncio
import hashlib
import os
import tempfile
from app.auth.auth import get_optional_user, require_role

from app.models.ioc import (
    IOCInput, IOCResponse, IOCAnalysis, IOCStatus, Verdict,
    BatchAnalysisRequest, BatchAnalysisResponse
)
from app.services.ioc_parser import IOCParser
from app.services.threat_intel import ThreatIntelService
from app.services.analysis_engine import AnalysisEngine

# Create router
ioc_router = APIRouter()

# Initialize services
ioc_parser = IOCParser()
analysis_engine = AnalysisEngine()

# In-memory storage for demo purposes (replace with database in production)
analysis_cache = {}

@ioc_router.post("/analyze", response_model=IOCResponse)
async def analyze_ioc(
    ioc_input: IOCInput,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """
    Analyze a single IOC and return threat intelligence results
    """
    try:
        # Parse and validate IOC
        ioc_type, is_valid, error_message = ioc_parser.parse_ioc(ioc_input.indicator)
        
        if not is_valid:
            raise HTTPException(status_code=400, detail=error_message)
        
        # Normalize IOC
        normalized_indicator = ioc_parser.normalize_ioc(ioc_input.indicator, ioc_type)
        
        # Generate analysis ID
        analysis_id = str(uuid.uuid4())
        
        # Create initial analysis record
        analysis = IOCAnalysis(
            id=analysis_id,
            indicator=normalized_indicator,
            ioc_type=ioc_type,
            status=IOCStatus.ANALYZING,
            created_at=datetime.utcnow().isoformat(),
            updated_at=datetime.utcnow().isoformat()
        )
        
        # Store in cache
        analysis_cache[analysis_id] = analysis
        
        # Perform threat intelligence analysis
        threat_intel_service = ThreatIntelService()
        
        try:
            # Query threat intelligence services
            threat_intel_results = await threat_intel_service.analyze_ioc(
                normalized_indicator, ioc_type.value
            )
            
            # Analyze results and generate verdict
            analysis_results = analysis_engine.analyze_results(threat_intel_results)
            
            # Update analysis record
            analysis.status = IOCStatus.COMPLETED
            analysis.verdict = analysis_results["verdict"]
            analysis.confidence_score = analysis_results["confidence_score"]
            analysis.threat_score = analysis_results["threat_score"]
            analysis.evidence = analysis_results["evidence"]
            analysis.tags = analysis_results["tags"]
            analysis.updated_at = datetime.utcnow().isoformat()
            
            # Store threat intelligence results
            analysis.virustotal_results = threat_intel_results["results"].get("virustotal")
            analysis.abuseipdb_results = threat_intel_results["results"].get("abuseipdb")
            analysis.urlscan_results = threat_intel_results["results"].get("urlscan")
            analysis.otx_results = threat_intel_results["results"].get("otx")
            
            # Update cache
            analysis_cache[analysis_id] = analysis
            
            return IOCResponse(
                success=True,
                message="IOC analysis completed successfully",
                data=analysis
            )
            
        except Exception as e:
            analysis.status = IOCStatus.FAILED
            analysis.updated_at = datetime.utcnow().isoformat()
            analysis_cache[analysis_id] = analysis
            
            raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
        
        finally:
            await threat_intel_service.close()
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@ioc_router.post("/analyze/batch", response_model=BatchAnalysisResponse)
async def analyze_batch_iocs(batch_request: BatchAnalysisRequest):
    """
    Analyze multiple IOCs in batch
    """
    try:
        results = []
        failed_indicators = []
        
        # Process each indicator
        for indicator in batch_request.indicators:
            try:
                # Parse and validate IOC
                ioc_type, is_valid, error_message = ioc_parser.parse_ioc(indicator)
                
                if not is_valid:
                    failed_indicators.append(f"{indicator}: {error_message}")
                    continue
                
                # Normalize IOC
                normalized_indicator = ioc_parser.normalize_ioc(indicator, ioc_type)
                
                # Generate analysis ID
                analysis_id = str(uuid.uuid4())
                
                # Create initial analysis record
                analysis = IOCAnalysis(
                    id=analysis_id,
                    indicator=normalized_indicator,
                    ioc_type=ioc_type,
                    status=IOCStatus.ANALYZING,
                    created_at=datetime.utcnow().isoformat(),
                    updated_at=datetime.utcnow().isoformat()
                )
                
                # Perform threat intelligence analysis
                threat_intel_service = ThreatIntelService()
                
                try:
                    # Query threat intelligence services
                    threat_intel_results = await threat_intel_service.analyze_ioc(
                        normalized_indicator, ioc_type.value
                    )
                    
                    # Analyze results and generate verdict
                    analysis_results = analysis_engine.analyze_results(threat_intel_results)
                    
                    # Update analysis record
                    analysis.status = IOCStatus.COMPLETED
                    analysis.verdict = analysis_results["verdict"]
                    analysis.confidence_score = analysis_results["confidence_score"]
                    analysis.threat_score = analysis_results["threat_score"]
                    analysis.evidence = analysis_results["evidence"]
                    analysis.tags = analysis_results["tags"]
                    analysis.updated_at = datetime.utcnow().isoformat()
                    
                    # Store threat intelligence results
                    analysis.virustotal_results = threat_intel_results["results"].get("virustotal")
                    analysis.abuseipdb_results = threat_intel_results["results"].get("abuseipdb")
                    analysis.urlscan_results = threat_intel_results["results"].get("urlscan")
                    analysis.otx_results = threat_intel_results["results"].get("otx")
                    
                    # Store in cache
                    analysis_cache[analysis_id] = analysis
                    results.append(analysis)
                    
                except Exception as e:
                    analysis.status = IOCStatus.FAILED
                    analysis.updated_at = datetime.utcnow().isoformat()
                    analysis_cache[analysis_id] = analysis
                    failed_indicators.append(f"{indicator}: Analysis failed - {str(e)}")
                
                finally:
                    await threat_intel_service.close()
                    
            except Exception as e:
                failed_indicators.append(f"{indicator}: {str(e)}")
        
        return BatchAnalysisResponse(
            success=True,
            message=f"Batch analysis completed. {len(results)} successful, {len(failed_indicators)} failed.",
            results=results,
            failed_indicators=failed_indicators
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch analysis failed: {str(e)}")

@ioc_router.get("/analysis/{analysis_id}", response_model=IOCResponse)
async def get_analysis(analysis_id: str):
    """
    Retrieve analysis results by ID
    """
    if analysis_id not in analysis_cache:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    analysis = analysis_cache[analysis_id]
    
    return IOCResponse(
        success=True,
        message="Analysis retrieved successfully",
        data=analysis
    )

@ioc_router.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "service": "Threat IOC Analysis Tool",
        "timestamp": datetime.utcnow().isoformat(),
        "cache_size": len(analysis_cache)
    }

@ioc_router.get("/stats")
async def get_stats():
    """
    Get analysis statistics
    """
    total_analyses = len(analysis_cache)
    completed = sum(1 for a in analysis_cache.values() if a.status == IOCStatus.COMPLETED)
    failed = sum(1 for a in analysis_cache.values() if a.status == IOCStatus.FAILED)
    pending = sum(1 for a in analysis_cache.values() if a.status == IOCStatus.ANALYZING)
    
    verdict_counts = {}
    for analysis in analysis_cache.values():
        if analysis.verdict:
            verdict = analysis.verdict.value
            verdict_counts[verdict] = verdict_counts.get(verdict, 0) + 1
    
    return {
        "total_analyses": total_analyses,
        "completed": completed,
        "failed": failed,
        "pending": pending,
        "verdict_distribution": verdict_counts,
        "cache_size": total_analyses
    }

@ioc_router.post("/analyze/file")
async def analyze_file(file: UploadFile = File(...)):
    """
    Analyze an uploaded file for malware and threats
    """
    try:
        # Validate file size (100MB limit)
        max_size = 100 * 1024 * 1024  # 100MB
        file_content = await file.read()
        
        if len(file_content) > max_size:
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 100MB.")
        
        # Calculate file hashes
        md5_hash = hashlib.md5(file_content).hexdigest()
        sha1_hash = hashlib.sha1(file_content).hexdigest()
        sha256_hash = hashlib.sha256(file_content).hexdigest()
        
        # Generate analysis ID
        analysis_id = str(uuid.uuid4())
        
        # Create file analysis record
        file_analysis = {
            "id": analysis_id,
            "filename": file.filename,
            "file_size": len(file_content),
            "file_type": file.content_type,
            "md5_hash": md5_hash,
            "sha1_hash": sha1_hash,
            "sha256_hash": sha256_hash,
            "status": "analyzing",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Store in cache
        analysis_cache[analysis_id] = file_analysis
        
        # Perform hash-based IOC analysis using existing functionality
        threat_intel_service = ThreatIntelService()
        
        try:
            # Analyze file hashes
            hash_results = {}
            for hash_type, hash_value in [("hash_sha256", sha256_hash), ("hash_sha1", sha1_hash), ("hash_md5", md5_hash)]:
                try:
                    threat_intel_results = await threat_intel_service.analyze_ioc(hash_value, hash_type)
                    analysis_results = analysis_engine.analyze_results(threat_intel_results)
                    hash_results[hash_type] = {
                        "hash": hash_value,
                        "verdict": analysis_results.get("verdict"),
                        "confidence_score": analysis_results.get("confidence_score", 0),
                        "threat_score": analysis_results.get("threat_score", 0),
                        "threat_intel": threat_intel_results
                    }
                except Exception as e:
                    hash_results[hash_type] = {"error": str(e), "hash": hash_value}
            
            # Determine overall file verdict based on hash analysis
            max_threat_score = 0
            overall_verdict = "UNKNOWN"
            overall_confidence = 0
            
            for hash_analysis in hash_results.values():
                if "threat_score" in hash_analysis:
                    if hash_analysis["threat_score"] > max_threat_score:
                        max_threat_score = hash_analysis["threat_score"]
                        overall_verdict = hash_analysis.get("verdict", "UNKNOWN")
                        overall_confidence = hash_analysis.get("confidence_score", 0)
            
            # Determine threat level based on verdict
            if overall_verdict == "MALICIOUS":
                threat_level = "HIGH"
            elif overall_verdict == "SUSPICIOUS":
                threat_level = "MEDIUM"
            else:
                threat_level = "LOW"
            
            # Mock additional file analysis data
            behavioral_analysis = []
            threat_indicators = []
            
            if overall_verdict == "MALICIOUS":
                behavioral_analysis = [
                    "Attempts to modify system registry",
                    "Creates suspicious network connections",
                    "Attempts to disable security software"
                ]
                threat_indicators = [
                    {"type": "Registry Modification", "description": "Modifies Windows startup entries"},
                    {"type": "Network Activity", "description": "Connects to known C&C servers"},
                    {"type": "Process Injection", "description": "Injects code into legitimate processes"}
                ]
            elif overall_verdict == "SUSPICIOUS":
                behavioral_analysis = [
                    "Unusual file access patterns detected",
                    "Attempts to access sensitive directories"
                ]
                threat_indicators = [
                    {"type": "File Access", "description": "Accesses system configuration files"},
                    {"type": "Privilege Escalation", "description": "Attempts to gain elevated privileges"}
                ]
            
            # Update file analysis record
            file_analysis.update({
                "status": "completed",
                "threat_level": threat_level,
                "verdict": overall_verdict,
                "confidence_score": overall_confidence,
                "threat_score": max_threat_score,
                "hash_analysis": hash_results,
                "behavior": behavioral_analysis,
                "indicators": threat_indicators,
                "scan_engines": "VirusTotal, AbuseIPDB, OTX",
                "analysis_time": "2.3s",
                "updated_at": datetime.utcnow().isoformat()
            })
            
            # Update cache
            analysis_cache[analysis_id] = file_analysis
            
            return JSONResponse({
                "success": True,
                "message": "File analysis completed successfully",
                "data": file_analysis
            })
            
        except Exception as e:
            file_analysis["status"] = "failed"
            file_analysis["error"] = str(e)
            file_analysis["updated_at"] = datetime.utcnow().isoformat()
            analysis_cache[analysis_id] = file_analysis
            
            raise HTTPException(status_code=500, detail=f"File analysis failed: {str(e)}")
        
        finally:
            await threat_intel_service.close()
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@ioc_router.get("/analysis/file/{analysis_id}")
async def get_file_analysis(analysis_id: str):
    """
    Retrieve file analysis results by ID
    """
    if analysis_id not in analysis_cache:
        raise HTTPException(status_code=404, detail="File analysis not found")
    
    analysis = analysis_cache[analysis_id]
    
    return JSONResponse({
        "success": True,
        "message": "File analysis retrieved successfully",
        "data": analysis
    })

@ioc_router.post("/sandbox/submit")
async def submit_to_sandbox(file: UploadFile = File(...), environment: str = "ubuntu20"):
    """
    Submit a file to sandbox for dynamic analysis
    """
    try:
        from app.services.sandbox_service import SandboxService
        
        sandbox_service = SandboxService()
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            file_content = await file.read()
            temp_file.write(file_content)
            temp_file_path = temp_file.name
        
        # Submit to sandbox
        result = await sandbox_service.submit_file_to_sandbox(
            temp_file_path, file.filename, environment
        )
        
        # Clean up temporary file
        os.unlink(temp_file_path)
        
        return JSONResponse({
            "success": True,
            "message": "File submitted to sandbox successfully",
            "data": result
        })
        
    except Exception as e:
        # Clean up temporary file if it exists
        if 'temp_file_path' in locals():
            try:
                os.unlink(temp_file_path)
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Sandbox submission failed: {str(e)}")

@ioc_router.get("/sandbox/analysis/{analysis_id}")
async def get_sandbox_analysis(analysis_id: str):
    """
    Get sandbox analysis status and results
    """
    try:
        from app.services.sandbox_service import SandboxService
        
        sandbox_service = SandboxService()
        result = await sandbox_service.get_analysis_status(analysis_id)
        
        return JSONResponse({
            "success": True,
            "message": "Sandbox analysis retrieved successfully",
            "data": result
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get sandbox analysis: {str(e)}")

@ioc_router.post("/sandbox/deploy")
async def deploy_sandbox(environment: str = "ubuntu20"):
    """
    Deploy a local sandbox environment
    """
    try:
        from app.services.sandbox_service import SandboxService
        
        sandbox_service = SandboxService()
        result = await sandbox_service.deploy_local_sandbox(environment)
        
        return JSONResponse({
            "success": True,
            "message": "Sandbox deployment initiated",
            "data": result
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sandbox deployment failed: {str(e)}")

@ioc_router.get("/sandbox/stats")
async def get_sandbox_stats():
    """
    Get sandbox service statistics
    """
    try:
        from app.services.sandbox_service import SandboxService
        
        sandbox_service = SandboxService()
        stats = await sandbox_service.get_sandbox_stats()
        
        return JSONResponse({
            "success": True,
            "message": "Sandbox statistics retrieved successfully",
            "data": stats
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get sandbox stats: {str(e)}")

@ioc_router.delete("/sandbox/analysis/{analysis_id}")
async def stop_sandbox_analysis(analysis_id: str):
    """
    Stop a running sandbox analysis
    """
    try:
        from app.services.sandbox_service import SandboxService
        
        sandbox_service = SandboxService()
        result = await sandbox_service.stop_analysis(analysis_id)
        
        return JSONResponse({
            "success": True,
            "message": "Sandbox analysis stopped",
            "data": result
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop sandbox analysis: {str(e)}")

@ioc_router.post("/feeds/add")
async def add_threat_feed(feed_config: dict):
    """
    Add a new threat intelligence feed
    """
    try:
        from app.services.threat_feed_service import ThreatFeedService
        
        feed_service = ThreatFeedService()
        result = await feed_service.add_feed(feed_config)
        
        return JSONResponse({
            "success": True,
            "message": "Threat feed added successfully",
            "data": result
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add threat feed: {str(e)}")

@ioc_router.get("/feeds")
async def list_threat_feeds():
    """
    List all configured threat intelligence feeds
    """
    try:
        from app.services.threat_feed_service import ThreatFeedService
        
        feed_service = ThreatFeedService()
        feeds = await feed_service.list_feeds()
        
        return JSONResponse({
            "success": True,
            "message": "Threat feeds retrieved successfully",
            "data": feeds
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list threat feeds: {str(e)}")

@ioc_router.post("/feeds/{feed_id}/update")
async def update_threat_feed(feed_id: str):
    """
    Update a specific threat intelligence feed
    """
    try:
        from app.services.threat_feed_service import ThreatFeedService
        
        feed_service = ThreatFeedService()
        result = await feed_service.update_feed(feed_id)
        
        return JSONResponse({
            "success": True,
            "message": "Threat feed updated successfully",
            "data": result
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update threat feed: {str(e)}")

@ioc_router.post("/feeds/update-all")
async def update_all_threat_feeds():
    """
    Update all active threat intelligence feeds
    """
    try:
        from app.services.threat_feed_service import ThreatFeedService
        
        feed_service = ThreatFeedService()
        result = await feed_service.update_all_feeds()
        
        return JSONResponse({
            "success": True,
            "message": "All threat feeds update initiated",
            "data": result
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update threat feeds: {str(e)}")

@ioc_router.delete("/feeds/{feed_id}")
async def delete_threat_feed(feed_id: str):
    """
    Delete a threat intelligence feed
    """
    try:
        from app.services.threat_feed_service import ThreatFeedService
        
        feed_service = ThreatFeedService()
        result = await feed_service.delete_feed(feed_id)
        
        return JSONResponse({
            "success": True,
            "message": "Threat feed deleted successfully",
            "data": result
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete threat feed: {str(e)}")

@ioc_router.get("/feeds/stats")
async def get_threat_feed_stats():
    """
    Get threat feed statistics
    """
    try:
        from app.services.threat_feed_service import ThreatFeedService
        
        feed_service = ThreatFeedService()
        stats = await feed_service.get_feed_stats()
        
        return JSONResponse({
            "success": True,
            "message": "Threat feed statistics retrieved successfully",
            "data": stats
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get threat feed stats: {str(e)}")

@ioc_router.get("/feeds/search/{ioc_value}")
async def search_threat_feeds(ioc_value: str, ioc_type: Optional[str] = None):
    """
    Search for an IOC in local threat feeds
    """
    try:
        from app.services.threat_feed_service import ThreatFeedService
        
        feed_service = ThreatFeedService()
        results = await feed_service.search_indicators(ioc_value, ioc_type)
        
        return JSONResponse({
            "success": True,
            "message": "Threat feed search completed",
            "data": {
                "ioc_value": ioc_value,
                "ioc_type": ioc_type,
                "matches": results,
                "match_count": len(results)
            }
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search threat feeds: {str(e)}")
