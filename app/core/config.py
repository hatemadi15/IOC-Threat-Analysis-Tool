from pydantic import BaseModel
from typing import Optional
import os

class Settings(BaseModel):
    # API Configuration
    api_title: str = "Threat IOC Analysis Tool"
    api_version: str = "1.0.0"
    debug: bool = False
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Database Configuration
    database_url: str = "sqlite:///./chimera.db"
    
    # Redis Configuration
    redis_url: str = "redis://localhost:6379"
    
    # API Keys for Threat Intelligence Services
    virustotal_api_key: Optional[str] = None
    abuseipdb_api_key: Optional[str] = None
    urlscan_api_key: Optional[str] = None
    otx_api_key: Optional[str] = None
    
    # Rate Limiting
    rate_limit_per_minute: int = 60
    
    # Cache Configuration
    cache_ttl: int = 3600  # 1 hour

# Global settings instance
settings = Settings()

# Load API keys from environment
def load_api_keys():
    """Load API keys from environment variables"""
    api_keys = {}
    
    if os.getenv("VIRUSTOTAL_API_KEY"):
        api_keys["virustotal"] = os.getenv("VIRUSTOTAL_API_KEY")
    if os.getenv("ABUSEIPDB_API_KEY"):
        api_keys["abuseipdb"] = os.getenv("ABUSEIPDB_API_KEY")
    if os.getenv("URLSCAN_API_KEY"):
        api_keys["urlscan"] = os.getenv("URLSCAN_API_KEY")
    if os.getenv("OTX_API_KEY"):
        api_keys["otx"] = os.getenv("OTX_API_KEY")
    
    return api_keys
