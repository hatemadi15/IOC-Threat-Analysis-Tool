import re
import ipaddress
from typing import Tuple, Optional
from app.models.ioc import IOCType

class IOCParser:
    """Service for parsing and validating different types of IOCs"""
    
    # Regex patterns for different IOC types
    PATTERNS = {
        IOCType.EMAIL: r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
        IOCType.HASH_MD5: r'^[a-fA-F0-9]{32}$',
        IOCType.HASH_SHA1: r'^[a-fA-F0-9]{40}$',
        IOCType.HASH_SHA256: r'^[a-fA-F0-9]{64}$',
    }
    
    @staticmethod
    def parse_ioc(indicator: str) -> Tuple[IOCType, bool, str]:
        """
        Parse an IOC and determine its type and validity
        
        Args:
            indicator: The IOC string to parse
            
        Returns:
            Tuple of (IOCType, is_valid, error_message)
        """
        indicator = indicator.strip()
        
        if not indicator:
            return IOCType.UNKNOWN, False, "Indicator cannot be empty"
        
        # Check for hash types first (most specific)
        if IOCParser._is_hash(indicator):
            hash_type = IOCParser._get_hash_type(indicator)
            return hash_type, True, ""
        
        # Check for email
        if IOCParser._is_email(indicator):
            return IOCType.EMAIL, True, ""
        
        # Check for IP address
        if IOCParser._is_ip_address(indicator):
            return IOCType.IP_ADDRESS, True, ""
        
        # Check for URL
        if IOCParser._is_url(indicator):
            return IOCType.URL, True, ""
        
        # Check for domain
        if IOCParser._is_domain(indicator):
            return IOCType.DOMAIN, True, ""
        
        return IOCType.UNKNOWN, False, "Unable to determine IOC type"
    
    @staticmethod
    def _is_hash(indicator: str) -> bool:
        """Check if the indicator is a hash"""
        return any(
            re.match(pattern, indicator, re.IGNORECASE)
            for pattern in [
                IOCParser.PATTERNS[IOCType.HASH_MD5],
                IOCParser.PATTERNS[IOCType.HASH_SHA1],
                IOCParser.PATTERNS[IOCType.HASH_SHA256]
            ]
        )
    
    @staticmethod
    def _get_hash_type(indicator: str) -> IOCType:
        """Determine the specific hash type"""
        length = len(indicator)
        if length == 32:
            return IOCType.HASH_MD5
        elif length == 40:
            return IOCType.HASH_SHA1
        elif length == 64:
            return IOCType.HASH_SHA256
        else:
            return IOCType.UNKNOWN
    
    @staticmethod
    def _is_email(indicator: str) -> bool:
        """Check if the indicator is an email address"""
        return bool(re.match(IOCParser.PATTERNS[IOCType.EMAIL], indicator))
    
    @staticmethod
    def _is_ip_address(indicator: str) -> bool:
        """Check if the indicator is an IP address"""
        try:
            ipaddress.ip_address(indicator)
            return True
        except ValueError:
            return False
    
    @staticmethod
    def _is_url(indicator: str) -> bool:
        """Check if the indicator is a URL"""
        # Basic URL validation without external dependencies
        url_pattern = r'^https?://[^\s/$.?#].[^\s]*$'
        return bool(re.match(url_pattern, indicator))
    
    @staticmethod
    def _is_domain(indicator: str) -> bool:
        """Check if the indicator is a domain"""
        # Basic domain validation without external dependencies
        domain_pattern = r'^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$'
        
        # Remove protocol if present
        clean_domain = indicator
        if indicator.startswith(('http://', 'https://')):
            clean_domain = indicator.split('://', 1)[1]
        
        # Remove path if present
        if '/' in clean_domain:
            clean_domain = clean_domain.split('/', 1)[0]
        
        # Remove port if present
        if ':' in clean_domain:
            clean_domain = clean_domain.split(':', 1)[0]
        
        # Check if it's a valid domain
        if re.match(domain_pattern, clean_domain) and '.' in clean_domain:
            return True
        
        return False
    
    @staticmethod
    def normalize_ioc(indicator: str, ioc_type: IOCType) -> str:
        """
        Normalize an IOC based on its type
        
        Args:
            indicator: The IOC string
            ioc_type: The type of IOC
            
        Returns:
            Normalized IOC string
        """
        if ioc_type == IOCType.EMAIL:
            return indicator.lower().strip()
        elif ioc_type in [IOCType.HASH_MD5, IOCType.HASH_SHA1, IOCType.HASH_SHA256]:
            return indicator.lower().strip()
        elif ioc_type == IOCType.IP_ADDRESS:
            return indicator.strip()
        elif ioc_type == IOCType.URL:
            # Ensure URL has protocol
            if not indicator.startswith(('http://', 'https://')):
                return f"https://{indicator}"
            return indicator
        elif ioc_type == IOCType.DOMAIN:
            # Remove protocol and path, keep only domain
            clean_domain = indicator
            if indicator.startswith(('http://', 'https://')):
                clean_domain = indicator.split('://', 1)[1]
            if '/' in clean_domain:
                clean_domain = clean_domain.split('/', 1)[0]
            if ':' in clean_domain:
                clean_domain = clean_domain.split(':', 1)[0]
            return clean_domain.lower().strip()
        
        return indicator.strip()
    
    @staticmethod
    def validate_ioc(indicator: str, ioc_type: IOCType) -> Tuple[bool, str]:
        """
        Validate an IOC based on its type
        
        Args:
            indicator: The IOC string
            ioc_type: The type of IOC
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if ioc_type == IOCType.UNKNOWN:
            return False, "Unknown IOC type"
        
        # Basic validation based on type
        if ioc_type == IOCType.EMAIL:
            return IOCParser._is_email(indicator), "Invalid email format"
        elif ioc_type in [IOCType.HASH_MD5, IOCType.HASH_SHA1, IOCType.HASH_SHA256]:
            return IOCParser._is_hash(indicator), "Invalid hash format"
        elif ioc_type == IOCType.IP_ADDRESS:
            return IOCParser._is_ip_address(indicator), "Invalid IP address format"
        elif ioc_type == IOCType.URL:
            return IOCParser._is_url(indicator), "Invalid URL format"
        elif ioc_type == IOCType.DOMAIN:
            return IOCParser._is_domain(indicator), "Invalid domain format"
        
        return False, "Unsupported IOC type"
