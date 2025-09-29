from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import secrets

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Bearer token security
security = HTTPBearer(auto_error=False)

class AuthManager:
    """Authentication and authorization manager"""
    
    def __init__(self):
        self.users_db = {
            "admin": {
                "username": "admin",
                "email": "admin@threatanalysis.local",
                "hashed_password": self.get_password_hash("admin123"),
                "roles": ["admin", "analyst"],
                "is_active": True
            },
            "analyst": {
                "username": "analyst", 
                "email": "analyst@threatanalysis.local",
                "hashed_password": self.get_password_hash("analyst123"),
                "roles": ["analyst"],
                "is_active": True
            }
        }
        self.api_keys = {
            "demo-api-key": {
                "name": "Demo API Key",
                "roles": ["api_user"],
                "is_active": True,
                "created_at": datetime.utcnow()
            }
        }
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password: str) -> str:
        """Hash a password"""
        return pwd_context.hash(password)
    
    def authenticate_user(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticate a user with username and password"""
        user = self.users_db.get(username)
        if not user or not self.verify_password(password, user["hashed_password"]):
            return None
        return user
    
    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify and decode a JWT token"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            username: str = payload.get("sub")
            if username is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication credentials",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            return payload
        except jwt.PyJWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials", 
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    def verify_api_key(self, api_key: str) -> Optional[Dict[str, Any]]:
        """Verify an API key"""
        key_info = self.api_keys.get(api_key)
        if key_info and key_info.get("is_active", False):
            return key_info
        return None
    
    def get_user(self, username: str) -> Optional[Dict[str, Any]]:
        """Get user by username"""
        return self.users_db.get(username)
    
    def has_permission(self, user: Dict[str, Any], required_role: str) -> bool:
        """Check if user has required role/permission"""
        user_roles = user.get("roles", [])
        return required_role in user_roles or "admin" in user_roles

# Global auth manager instance
auth_manager = AuthManager()

# Dependency functions
async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict[str, Any]:
    """Get current authenticated user from JWT token"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Try JWT token first
    try:
        payload = auth_manager.verify_token(credentials.credentials)
        username = payload.get("sub")
        user = auth_manager.get_user(username)
        if user and user.get("is_active", False):
            return user
    except HTTPException:
        pass
    
    # Try API key authentication
    api_key_info = auth_manager.verify_api_key(credentials.credentials)
    if api_key_info:
        return {
            "username": "api_user",
            "roles": api_key_info.get("roles", []),
            "is_active": True,
            "auth_type": "api_key"
        }
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

async def get_current_active_user(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Get current active user"""
    if not current_user.get("is_active", False):
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def require_role(required_role: str):
    """Decorator to require specific role"""
    def role_checker(current_user: Dict[str, Any] = Depends(get_current_active_user)) -> Dict[str, Any]:
        if not auth_manager.has_permission(current_user, required_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {required_role}"
            )
        return current_user
    return role_checker

# Optional authentication (for public endpoints that can benefit from auth)
async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[Dict[str, Any]]:
    """Get current user if authenticated, None otherwise"""
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None
