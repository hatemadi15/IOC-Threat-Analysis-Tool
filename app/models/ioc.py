from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from enum import Enum
import re
import ipaddress
# import validators  # Removed dependency

class IOCType(str, Enum):
    """Enumeration of supported IOC types"""
    URL = "url"
    DOMAIN = "domain"
    IP_ADDRESS = "ip_address"
    HASH_MD5 = "hash_md5"
    HASH_SHA1 = "hash_sha1"
    HASH_SHA256 = "hash_sha256"
    EMAIL = "email"
    UNKNOWN = "unknown"

class IOCStatus(str, Enum):
    """Enumeration of IOC analysis status"""
    PENDING = "pending"
    ANALYZING = "analyzing"
    COMPLETED = "completed"
    FAILED = "failed"

class Verdict(str, Enum):
    """Enumeration of threat verdicts"""
    MALICIOUS = "malicious"
    SUSPICIOUS = "suspicious"
    BENIGN = "benign"
    UNKNOWN = "unknown"

class IOCInput(BaseModel):
    """Input model for IOC analysis requests"""
    indicator: str = Field(..., description="The IOC to analyze")
    description: Optional[str] = Field(None, description="Optional description of the IOC")
    
    @validator('indicator')
    def validate_indicator(cls, v):
        if not v or not v.strip():
            raise ValueError('Indicator cannot be empty')
        return v.strip()

class IOCAnalysis(BaseModel):
    """Model for IOC analysis results"""
    id: str
    indicator: str
    ioc_type: IOCType
    status: IOCStatus
    verdict: Optional[Verdict] = None
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    threat_score: Optional[float] = Field(None, ge=0.0, le=100.0)
    analysis_time: Optional[float] = None  # in seconds
    created_at: str
    updated_at: str
    
    # Threat intelligence results
    virustotal_results: Optional[Dict[str, Any]] = None
    abuseipdb_results: Optional[Dict[str, Any]] = None
    urlscan_results: Optional[Dict[str, Any]] = None
    otx_results: Optional[Dict[str, Any]] = None
    
    # Aggregated evidence
    evidence: List[Dict[str, Any]] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    
    class Config:
        json_encoders = {
            IOCType: lambda v: v.value,
            IOCStatus: lambda v: v.value,
            Verdict: lambda v: v.value
        }

class IOCResponse(BaseModel):
    """Response model for IOC analysis"""
    success: bool
    message: str
    data: Optional[IOCAnalysis] = None
    error: Optional[str] = None

class BatchAnalysisRequest(BaseModel):
    """Request model for batch IOC analysis"""
    indicators: List[str] = Field(..., min_items=1, max_items=100)
    description: Optional[str] = None

class BatchAnalysisResponse(BaseModel):
    """Response model for batch IOC analysis"""
    success: bool
    message: str
    results: List[IOCAnalysis] = Field(default_factory=list)
    failed_indicators: List[str] = Field(default_factory=list)
