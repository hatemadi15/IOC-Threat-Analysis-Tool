# 🚀 Quick Start Guide - Threat IOC Analysis Tool

## 📋 Prerequisites

- **Python 3.8+** (Python 3.13 recommended)
- **Git** (to clone the repository)
- **API Keys** for threat intelligence services (see API Keys section below)

## 🛠️ Installation Steps

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd chimera
```

### 2. Install Python Dependencies
```bash
# Install required packages
pip install fastapi uvicorn pydantic httpx python-multipart python-dotenv

# Or install all at once (if requirements.txt is available)
pip install -r requirements.txt
```

### 3. Set Up API Keys
Create a `.env` file in the project root directory:

```bash
# Windows
notepad .env

# macOS/Linux
nano .env
```

Add your API keys to the `.env` file:
```env
VIRUSTOTAL_API_KEY=your_virustotal_api_key_here
ABUSEIPDB_API_KEY=your_abuseipdb_api_key_here
URLSCAN_API_KEY=your_urlscan_api_key_here
OTX_API_KEY=your_otx_api_key_here
```

### 4. Get API Keys (Free)

#### VirusTotal
- Go to [VirusTotal](https://www.virustotal.com/)
- Sign up for a free account
- Get your API key from your profile

#### AbuseIPDB
- Visit [AbuseIPDB](https://www.abuseipdb.com/)
- Create a free account
- Generate API key in your dashboard

#### URLScan.io
- Go to [URLScan.io](https://urlscan.io/)
- Sign up for free
- Get API key from your account settings

#### AlienVault OTX
- Visit [AlienVault OTX](https://otx.alienvault.com/)
- Create free account
- Get API key from your profile

## 🚀 Running the Application

### Option 1: Start the API Server
```bash
# Start the FastAPI server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Access the API:**
- **API Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health
- **Root Endpoint**: http://localhost:8000/

### Option 2: Use the Command Line Interface
```bash
# Analyze a single IOC
python cli.py analyze "8.8.8.8"

# Analyze multiple IOCs
python cli.py batch "8.8.8.8,malware.com,https://example.com"
```

### Option 3: Run Test Scripts
```bash
# Test basic functionality (no API keys needed)
python test_basic.py

# Test with real threat intelligence (requires API keys)
python test_real_threat_intel.py

# Demo IOC parser and analysis engine
python demo_ioc_parser.py
```

## 🔍 Testing the API

### Using the Web Interface
1. Open http://localhost:8000/docs in your browser
2. Click on any endpoint (e.g., `POST /api/v1/analyze`)
3. Click "Try it out"
4. Enter your IOC data
5. Click "Execute"

### Using curl
```bash
# Analyze a single IOC
curl -X POST "http://localhost:8000/api/v1/analyze" \
     -H "Content-Type: application/json" \
     -d '{"indicator": "8.8.8.8"}'

# Get analysis results
curl "http://localhost:8000/api/v1/analysis/{analysis_id}"

# Get statistics
curl "http://localhost:8000/api/v1/stats"
```

### Using Python requests
```python
import requests

# Analyze an IOC
response = requests.post(
    "http://localhost:8000/api/v1/analyze",
    json={"indicator": "8.8.8.8"}
)
print(response.json())
```

## 📊 Example IOCs to Test

### IP Addresses
- `8.8.8.8` (Google DNS - should be benign)
- `1.1.1.1` (Cloudflare DNS - should be benign)

### Domains
- `google.com` (should be benign)
- `example.com` (should be benign)

### URLs
- `https://google.com` (should be benign)
- `https://example.com` (should be benign)

### File Hashes
- `d41d8cd98f00b204e9800998ecf8427e` (empty file MD5)
- `da39a3ee5e6b4b0d3255bfef95601890afd80709` (empty file SHA1)

## 🐛 Troubleshooting

### Common Issues

#### 1. "Module not found" errors
```bash
# Reinstall dependencies
pip install --upgrade fastapi uvicorn pydantic httpx
```

#### 2. Port 8000 already in use
```bash
# Use a different port
python -m uvicorn main:app --reload --port 8001

# Or kill the process using port 8000
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:8000 | xargs kill -9
```

#### 3. API key errors
- Check your `.env` file exists and has correct format
- Verify API keys are valid and not expired
- Check if you've hit rate limits

#### 4. CORS errors (when calling from frontend)
- The API is configured to allow all origins (`*`)
- If you need specific origins, modify `main.py`

### Debug Mode
```bash
# Start with debug logging
python -m uvicorn main:app --reload --log-level debug
```

## 📁 Project Structure
```
chimera/
├── app/
│   ├── api/
│   │   └── routes.py          # API endpoints
│   ├── core/
│   │   └── config.py          # Configuration
│   ├── models/
│   │   └── ioc.py            # Data models
│   └── services/
│       ├── ioc_parser.py      # IOC parsing logic
│       ├── threat_intel.py    # Threat intelligence APIs
│       └── analysis_engine.py # Analysis logic
├── main.py                    # FastAPI application
├── cli.py                     # Command line interface
├── .env                       # API keys (create this)
├── requirements.txt           # Dependencies
└── README.md                  # Full documentation
```

## 🔒 Security Notes

- **Never commit your `.env` file** to version control
- **API keys are sensitive** - keep them secure
- **Rate limits** apply to free API tiers
- **The tool is for analysis only** - don't rely on it for production security

## 🆘 Getting Help

1. **Check the logs** when running the server
2. **Verify your API keys** are working
3. **Test with simple IOCs** first (like `8.8.8.8`)
4. **Check the full README.md** for detailed documentation

## 🎯 Next Steps

Once you have the basic tool running:

1. **Test with real suspicious IOCs** from your environment
2. **Build a frontend** using the API endpoints
3. **Add more threat intelligence sources**
4. **Implement caching** for better performance
5. **Add user authentication** for multi-user environments

---

**Happy Threat Hunting! 🕵️‍♂️**

*This tool is designed for educational and research purposes. Always follow responsible disclosure practices when analyzing potentially malicious content.*
