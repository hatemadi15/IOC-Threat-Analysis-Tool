from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Dict, Any
from datetime import timedelta
from app.auth.auth import auth_manager, get_current_active_user, get_current_user

# Create router
auth_router = APIRouter()

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token", auto_error=False)

# Pydantic models
class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user_info: Dict[str, Any]

class UserInfo(BaseModel):
    username: str
    email: str
    roles: list
    is_active: bool

class LoginRequest(BaseModel):
    username: str
    password: str

class ApiKeyRequest(BaseModel):
    name: str
    roles: list = ["api_user"]

@auth_router.post("/login", response_model=Token)
async def login(login_data: LoginRequest):
    """
    Authenticate user and return access token
    """
    user = auth_manager.authenticate_user(login_data.username, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=30)
    access_token = auth_manager.create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=30 * 60,  # 30 minutes in seconds
        user_info={
            "username": user["username"],
            "email": user["email"],
            "roles": user["roles"],
            "is_active": user["is_active"]
        }
    )

@auth_router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    OAuth2 compatible token endpoint
    """
    user = auth_manager.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=30)
    access_token = auth_manager.create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=30 * 60,
        user_info={
            "username": user["username"],
            "email": user["email"],
            "roles": user["roles"],
            "is_active": user["is_active"]
        }
    )

@auth_router.get("/me", response_model=UserInfo)
async def read_users_me(current_user: Dict[str, Any] = Depends(get_current_active_user)):
    """
    Get current user information
    """
    return UserInfo(
        username=current_user["username"],
        email=current_user.get("email", ""),
        roles=current_user["roles"],
        is_active=current_user["is_active"]
    )

@auth_router.get("/validate")
async def validate_token(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Validate current token
    """
    return {
        "valid": True,
        "user": {
            "username": current_user["username"],
            "roles": current_user["roles"],
            "auth_type": current_user.get("auth_type", "jwt")
        }
    }

@auth_router.post("/api-key")
async def create_api_key(
    request: ApiKeyRequest,
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Create a new API key (admin only)
    """
    if "admin" not in current_user.get("roles", []):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required"
        )
    
    import secrets
    api_key = f"tk_{secrets.token_urlsafe(32)}"
    
    auth_manager.api_keys[api_key] = {
        "name": request.name,
        "roles": request.roles,
        "is_active": True,
        "created_by": current_user["username"],
        "created_at": auth_manager.datetime.utcnow()
    }
    
    return {
        "api_key": api_key,
        "name": request.name,
        "roles": request.roles,
        "message": "API key created successfully"
    }

@auth_router.get("/api-keys")
async def list_api_keys(current_user: Dict[str, Any] = Depends(get_current_active_user)):
    """
    List API keys (admin only)
    """
    if "admin" not in current_user.get("roles", []):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required"
        )
    
    keys = []
    for key, info in auth_manager.api_keys.items():
        keys.append({
            "key_preview": f"{key[:8]}...{key[-4:]}",
            "name": info["name"],
            "roles": info["roles"],
            "is_active": info["is_active"],
            "created_by": info.get("created_by", "system"),
            "created_at": info.get("created_at", "unknown")
        })
    
    return {"api_keys": keys}

@auth_router.get("/demo-credentials")
async def get_demo_credentials():
    """
    Get demo login credentials (for development/demo purposes)
    """
    return {
        "demo_users": [
            {
                "username": "admin",
                "password": "admin123",
                "roles": ["admin", "analyst"],
                "description": "Administrator with full access"
            },
            {
                "username": "analyst", 
                "password": "analyst123",
                "roles": ["analyst"],
                "description": "Security analyst with analysis access"
            }
        ],
        "demo_api_key": "demo-api-key",
        "note": "These are demo credentials for testing. Change in production!"
    }
