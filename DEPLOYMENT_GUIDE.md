# 🚀 Enhanced Threat IOC Analysis Tool - Deployment Guide

## 🎯 Overview

This enhanced threat analysis platform now includes:

- ✅ **Modern React Frontend** - Complete web interface
- ✅ **File Upload & Analysis** - Dynamic malware analysis
- ✅ **Local Threat Feeds** - Download and ingest threat intelligence
- ✅ **Sandbox Integration** - Both cloud and local sandbox environments
- ✅ **Local Sandbox Deployment** - Containerized analysis environments
- ✅ **Enhanced APIs** - Comprehensive REST API endpoints

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Frontend│    │   FastAPI Backend│    │  Local Sandbox  │
│   (Port 3000)   │◄──►│   (Port 8000)    │◄──►│   (Docker)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ Threat Intel APIs│
                       │ • VirusTotal     │
                       │ • AbuseIPDB      │
                       │ • URLScan.io     │
                       │ • AlienVault OTX │
                       └──────────────────┘
```

## 🛠️ Prerequisites

### System Requirements
- **OS**: Linux, macOS, or Windows 10/11
- **Python**: 3.8+
- **Node.js**: 16+ (for frontend)
- **Docker**: 20.10+ (for sandbox)
- **Memory**: 8GB+ recommended
- **Storage**: 20GB+ free space

### Required Services
- **Docker Engine** - For local sandbox deployment
- **Redis** (optional) - For caching and rate limiting
- **PostgreSQL** (optional) - For persistent threat feed storage

## 🚀 Quick Start (Development)

### 1. Clone and Setup Backend

```bash
git clone <repository>
cd threat-ioc-analysis-tool

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp env.example .env
# Edit .env with your API keys
```

### 2. Setup Frontend

```bash
cd frontend
npm install
```

### 3. Start Development Servers

**Terminal 1 - Backend:**
```bash
# From project root
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
# From frontend directory
npm start
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 🐳 Production Deployment (Docker)

### 1. Full Stack Deployment

```bash
# Build and start all services
docker-compose -f docker-compose.sandbox.yml up -d

# Or start specific profiles
docker-compose -f docker-compose.sandbox.yml --profile frontend up -d
```

### 2. Sandbox-Only Deployment

```bash
# Start just the sandbox environment
docker-compose -f docker-compose.sandbox.yml --profile sandbox up -d
```

### 3. Air-Gapped Environment

```bash
# Build images locally
docker build -t threatanalysis/ubuntu20-sandbox:latest ./docker/sandbox

# Deploy without external dependencies
docker-compose -f docker-compose.sandbox.yml --profile sandbox up -d
```

## 🔧 Configuration

### API Keys Setup

Edit `.env` file with your threat intelligence API keys:

```env
# Threat Intelligence APIs
VIRUSTOTAL_API_KEY=your_vt_key_here
ABUSEIPDB_API_KEY=your_abuse_key_here
URLSCAN_API_KEY=your_urlscan_key_here
OTX_API_KEY=your_otx_key_here

# Database (optional)
DATABASE_URL=postgresql://user:pass@localhost:5432/threat_feeds

# Redis (optional)
REDIS_URL=redis://localhost:6379/0

# Sandbox Configuration
DOCKER_HOST=unix:///var/run/docker.sock
SANDBOX_TIMEOUT=300
MAX_CONCURRENT_ANALYSES=5
```

### Threat Feed Configuration

The platform supports multiple threat feed formats:

```json
{
  "name": "Custom Threat Feed",
  "url": "https://feeds.example.com/iocs.json",
  "format": "JSON",
  "interval": "1",
  "auth": "your_api_key"
}
```

**Supported Formats:**
- JSON
- CSV
- XML
- STIX/TAXII

## 🛡️ Security Considerations

### Network Isolation

Sandbox environments are network-isolated by default:

```yaml
# docker-compose.sandbox.yml
ubuntu-sandbox:
  network_mode: none  # No network access
  security_opt:
    - no-new-privileges:true
  cap_drop:
    - ALL
```

### File Upload Security

- Maximum file size: 100MB
- Supported formats: EXE, DLL, PDF, DOC, ZIP
- Files are scanned before analysis
- Temporary files are automatically cleaned up

### API Security

- Rate limiting enabled
- Input validation on all endpoints
- Secure file handling
- Error sanitization

## 📊 Usage Examples

### 1. IOC Analysis via Web Interface

1. Navigate to http://localhost:3000
2. Go to "IOC Analysis" page
3. Enter an IOC (domain, IP, hash, URL)
4. Click "Analyze" to get threat intelligence

### 2. File Analysis via Web Interface

1. Go to "File Analysis" page
2. Drag & drop files or click to upload
3. Files are automatically analyzed for threats
4. View detailed analysis results

### 3. API Usage

**Analyze IOC:**
```bash
curl -X POST "http://localhost:8000/api/v1/analyze" \
  -H "Content-Type: application/json" \
  -d '{"indicator": "malicious-domain.com"}'
```

**Upload File for Analysis:**
```bash
curl -X POST "http://localhost:8000/api/v1/analyze/file" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@suspicious.exe"
```

**Submit to Sandbox:**
```bash
curl -X POST "http://localhost:8000/api/v1/sandbox/submit" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@malware.exe" \
  -F "environment=ubuntu20"
```

### 4. Threat Feed Management

**Add Threat Feed:**
```bash
curl -X POST "http://localhost:8000/api/v1/feeds/add" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Custom Feed",
    "url": "https://feeds.example.com/iocs.json",
    "format": "JSON",
    "interval": "1"
  }'
```

## 🔍 Monitoring & Logs

### Application Logs

```bash
# View backend logs
docker-compose logs -f threat-analysis

# View sandbox logs
docker-compose logs -f ubuntu-sandbox
```

### Health Checks

- Backend: http://localhost:8000/health
- API Stats: http://localhost:8000/api/v1/stats
- Sandbox Stats: http://localhost:8000/api/v1/sandbox/stats

## 🚨 Troubleshooting

### Common Issues

1. **Docker Permission Denied**
   ```bash
   sudo usermod -aG docker $USER
   # Log out and back in
   ```

2. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :8000
   # Kill the process or change ports
   ```

3. **API Key Issues**
   ```bash
   # Test API connectivity
   curl -H "x-apikey: YOUR_VT_KEY" https://www.virustotal.com/vtapi/v2/domain/report?domain=google.com
   ```

4. **Sandbox Deployment Issues**
   ```bash
   # Check Docker daemon
   docker ps
   
   # Rebuild sandbox image
   docker build -t threatanalysis/ubuntu20-sandbox:latest ./docker/sandbox
   ```

### Performance Tuning

1. **Increase Analysis Timeout**
   ```env
   SANDBOX_TIMEOUT=600  # 10 minutes
   ```

2. **Concurrent Analysis Limit**
   ```env
   MAX_CONCURRENT_ANALYSES=10
   ```

3. **Memory Allocation**
   ```yaml
   ubuntu-sandbox:
     mem_limit: 4g  # Increase memory
   ```

## 📈 Scaling

### Horizontal Scaling

```bash
# Scale sandbox workers
docker-compose -f docker-compose.sandbox.yml up -d --scale ubuntu-sandbox=3

# Scale backend
docker-compose -f docker-compose.sandbox.yml up -d --scale threat-analysis=2
```

### Load Balancing

Use nginx or HAProxy to distribute load across multiple backend instances.

## 🔄 Updates & Maintenance

### Update Threat Feeds

```bash
# Manual update via API
curl -X POST "http://localhost:8000/api/v1/feeds/update-all"

# Or schedule with cron
0 */6 * * * curl -X POST "http://localhost:8000/api/v1/feeds/update-all"
```

### Backup & Restore

```bash
# Backup databases
docker-compose exec postgres pg_dump threat_feeds > backup.sql

# Backup analysis cache
docker-compose exec redis redis-cli BGSAVE
```

## 🎯 Next Steps

1. **Customize Analysis Rules** - Modify `app/services/analysis_engine.py`
2. **Add New Threat Intel Sources** - Extend `app/services/threat_intel.py`
3. **Create Custom Sandbox Images** - Build specialized analysis environments
4. **Integrate with SIEM** - Add webhook endpoints for alerts
5. **Implement User Authentication** - Add OAuth2/JWT authentication

## 📞 Support

For issues and feature requests:
1. Check the troubleshooting section above
2. Review API documentation at `/docs`
3. Check Docker logs for detailed error messages
4. Verify all environment variables are set correctly

## 🎉 Congratulations!

You now have a fully functional, enhanced threat intelligence platform with:
- Modern web interface
- File analysis capabilities
- Local threat feed management
- Sandbox analysis (cloud & local)
- Comprehensive API endpoints
- Docker-based deployment

Happy threat hunting! 🕵️‍♂️🛡️
