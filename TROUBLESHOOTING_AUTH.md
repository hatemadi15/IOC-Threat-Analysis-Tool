# 🔧 Authorization & Access Issues - Troubleshooting Guide

## 🚨 Common "Unauthorized Access" Issues & Solutions

### 1. **Missing API Keys** (Most Common)
**Problem**: External threat intelligence APIs returning 401/403 errors

**Symptoms**:
- "API key required" errors
- "Invalid API key" messages  
- Threat intel queries failing

**Solutions**:

#### Quick Fix:
```bash
# 1. Copy environment template
cp env.example .env

# 2. Edit .env file and add your API keys
nano .env
```

#### Add API Keys:
```env
# Threat Intelligence APIs
VIRUSTOTAL_API_KEY=your_actual_key_here
ABUSEIPDB_API_KEY=your_actual_key_here  
URLSCAN_API_KEY=your_actual_key_here
OTX_API_KEY=your_actual_key_here
```

#### Get Free API Keys:
- **VirusTotal**: https://www.virustotal.com/gui/join-us
- **AbuseIPDB**: https://www.abuseipdb.com/api
- **URLScan.io**: https://urlscan.io/about-api/
- **AlienVault OTX**: https://otx.alienvault.com/api

### 2. **Frontend Authentication Issues**
**Problem**: Can't access protected features in web interface

**Symptoms**:
- Login prompts on every page
- "Authentication required" messages
- 401 errors in browser console

**Solutions**:

#### Use Demo Credentials:
```
Username: admin
Password: admin123

OR

Username: analyst  
Password: analyst123
```

#### API Key Authentication:
```
Demo API Key: demo-api-key
```

#### Test Authentication:
```bash
# Test login endpoint
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### 3. **Docker Permission Issues**
**Problem**: Container permission denied errors

**Symptoms**:
- "Permission denied" on Docker socket
- Container startup failures
- Sandbox deployment errors

**Solutions**:

#### Add User to Docker Group:
```bash
sudo usermod -aG docker $USER
# Log out and back in
```

#### Fix Docker Socket Permissions:
```bash
sudo chmod 666 /var/run/docker.sock
```

#### Alternative Docker Commands:
```bash
# Run with sudo if needed
sudo docker-compose up -d
```

### 4. **CORS Issues**
**Problem**: Frontend can't communicate with backend

**Symptoms**:
- Network errors in browser
- "CORS policy" errors in console
- API requests failing

**Solutions**:

#### Development Mode:
```bash
# Start backend on specific host
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Start frontend with proxy
cd frontend && npm start
```

#### Production Mode:
```bash
# Use Docker with proper networking
docker-compose -f docker-compose.sandbox.yml up -d
```

### 5. **File Upload Permission Issues**
**Problem**: Can't upload files for analysis

**Symptoms**:
- "File upload failed" errors
- Permission denied on temp directories
- 413 "File too large" errors

**Solutions**:

#### Check File Size Limits:
```bash
# Files must be < 100MB by default
ls -lh your_file.exe
```

#### Fix Temp Directory Permissions:
```bash
sudo mkdir -p /tmp/threat-analysis
sudo chmod 777 /tmp/threat-analysis
```

#### Supported File Types:
- EXE, DLL, PDF, DOC, ZIP, images, text files

### 6. **Sandbox Access Issues**
**Problem**: Can't deploy or access sandbox environments

**Symptoms**:
- Sandbox deployment failures
- "Container not found" errors
- Docker connection issues

**Solutions**:

#### Check Docker Status:
```bash
docker ps
docker images
```

#### Deploy Sandbox Manually:
```bash
# Build sandbox image
docker build -t threatanalysis/ubuntu20-sandbox:latest ./docker/sandbox

# Deploy with docker-compose
docker-compose -f docker-compose.sandbox.yml --profile sandbox up -d
```

#### Test Sandbox Deployment:
```bash
curl -X POST "http://localhost:8000/api/v1/sandbox/deploy?environment=ubuntu20"
```

## 🔐 Security Configuration

### Environment Variables Setup
```env
# Authentication
SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database
DATABASE_URL=sqlite:///./threat_analysis.db

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Threat Intel APIs
VIRUSTOTAL_API_KEY=your_key
ABUSEIPDB_API_KEY=your_key
URLSCAN_API_KEY=your_key
OTX_API_KEY=your_key
```

### User Management
```bash
# View demo credentials
curl http://localhost:8000/api/v1/auth/demo-credentials

# Create API key (requires admin login)
curl -X POST "http://localhost:8000/api/v1/auth/api-key" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My API Key", "roles": ["analyst"]}'
```

## 🧪 Testing & Validation

### 1. Test Backend Health
```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/stats
```

### 2. Test Authentication
```bash
# Login and get token
TOKEN=$(curl -s -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' \
  | jq -r '.access_token')

# Use token for API calls
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/stats
```

### 3. Test IOC Analysis
```bash
# Test with authentication
curl -X POST "http://localhost:8000/api/v1/analyze" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"indicator": "google.com"}'

# Test with API key
curl -X POST "http://localhost:8000/api/v1/analyze" \
  -H "Authorization: Bearer demo-api-key" \
  -H "Content-Type: application/json" \
  -d '{"indicator": "malware.com"}'
```

### 4. Test File Upload
```bash
curl -X POST "http://localhost:8000/api/v1/analyze/file" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test_file.txt"
```

## 🚀 Quick Setup Commands

### Development Setup:
```bash
# 1. Install dependencies
pip install -r requirements.txt
cd frontend && npm install

# 2. Setup environment
cp env.example .env
# Edit .env with your API keys

# 3. Start services
uvicorn main:app --reload &
cd frontend && npm start &
```

### Production Setup:
```bash
# 1. Clone and configure
git clone <repository>
cp env.example .env
# Edit .env with production settings

# 2. Deploy with Docker
docker-compose -f docker-compose.sandbox.yml up -d

# 3. Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

## 📋 Verification Checklist

### ✅ Authentication Working:
- [ ] Can login with demo credentials
- [ ] JWT token generated successfully
- [ ] User menu shows in header
- [ ] Protected endpoints accessible

### ✅ API Access Working:
- [ ] Health check returns 200 OK
- [ ] IOC analysis works
- [ ] File upload works
- [ ] Threat feeds accessible

### ✅ Services Running:
- [ ] Backend on port 8000
- [ ] Frontend on port 3000 (if using)
- [ ] Docker containers running
- [ ] No error logs in console

### ✅ External APIs Working:
- [ ] VirusTotal API responds
- [ ] AbuseIPDB API responds  
- [ ] URLScan API responds
- [ ] OTX API responds

## 🆘 Still Having Issues?

### 1. Check Logs:
```bash
# Backend logs
tail -f logs/app.log

# Docker logs
docker-compose logs -f threat-analysis

# Frontend logs (browser console)
F12 → Console tab
```

### 2. Reset Everything:
```bash
# Stop all services
docker-compose down
pkill -f uvicorn
pkill -f npm

# Clean up
docker system prune -f
rm -rf node_modules
rm -rf __pycache__

# Fresh start
docker-compose -f docker-compose.sandbox.yml up -d --build
```

### 3. Contact Support:
- Check API documentation: http://localhost:8000/docs
- Review error messages carefully
- Test with curl commands above
- Verify all environment variables are set

## 🎯 Working Configuration Example

```env
# .env file that works
VIRUSTOTAL_API_KEY=your_actual_vt_key_here
ABUSEIPDB_API_KEY=your_actual_abuse_key_here
URLSCAN_API_KEY=optional_but_recommended
OTX_API_KEY=your_actual_otx_key_here

SECRET_KEY=supersecretkey123
DATABASE_URL=sqlite:///./threat_analysis.db
REDIS_URL=redis://localhost:6379
```

With this setup, you should be able to:
- Login with `admin/admin123` or `analyst/analyst123`
- Analyze IOCs through the web interface
- Upload files for analysis
- Deploy local sandboxes
- Manage threat feeds

The platform now includes comprehensive authentication and should resolve all "unauthorized access" issues! 🔐✅
