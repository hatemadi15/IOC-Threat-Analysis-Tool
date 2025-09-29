from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from app.api.routes import ioc_router
from app.api.auth_routes import auth_router
from app.core.config import settings

app = FastAPI(
    title="Threat IOC Analysis Tool",
    description="A unified threat intelligence platform for IOC analysis",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(ioc_router, prefix="/api/v1", tags=["IOC Analysis"])

@app.get("/")
async def root():
    return {
        "message": "Threat IOC Analysis Tool",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Threat IOC Analysis Tool"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
