# 🚀 Threat IOC Analysis Tool - Complete Setup Guide

## 📋 What This Tool Does

Your Threat IOC Analysis Tool is a **unified threat intelligence platform** that:

- **Accepts** URLs, domains, IP addresses, file hashes, and email addresses
- **Queries** multiple threat intelligence services simultaneously
- **Analyzes** the data using intelligent algorithms
- **Provides** threat verdicts with confidence scores and evidence

## 🔑 Step 1: Get Free API Keys

### VirusTotal
1. Go to: https://www.virustotal.com/gui/join-us
2. Sign up for a free account
3. Get your API key from your profile

### AbuseIPDB
1. Go to: https://www.abuseipdb.com/api
2. Sign up for a free account
3. Generate an API key

### URLScan.io
1. Go to: https://urlscan.io/about-api/
2. Sign up for a free account
3. Get your API key

### AlienVault OTX
1. Go to: https://otx.alienvault.com/api
2. Sign up for a free account
3. Get your API key

## ⚙️ Step 2: Configure Environment

1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` and add your API keys:
   ```env
   VIRUSTOTAL_API_KEY=your_actual_key_here
   ABUSEIPDB_API_KEY=your_actual_key_here
   URLSCAN_API_KEY=your_actual_key_here
   OTX_API_KEY=your_actual_key_here
   ```

## 🚀 Step 3: Install Dependencies

```bash
pip install fastapi uvicorn pydantic httpx
```

## 🧪 Step 4: Test the Tool

### Test Basic Functionality
```bash
python demo_ioc_parser.py
```

### Test with CLI (without API keys)
```bash
python cli.py "example.com"
```

### Start the API Server
```bash
uvicorn main:app --reload
```

Then visit: http://localhost:8000/docs

## 📖 Step 5: How to Use

### Method 1: Command Line Interface
```bash
# Analyze a single IOC
python cli.py "suspicious-domain.com"

# Analyze multiple IOCs
python cli.py --batch "domain1.com" "domain2.com" "192.168.1.1"

# Analyze with description
python cli.py "malware.example.com" "Suspicious domain from phishing email"
```

### Method 2: API Endpoints
```bash
# Start the server
uvicorn main:app --reload

# Use the interactive docs
# Visit: http://localhost:8000/docs

# Or use curl
curl -X POST "http://localhost:8000/api/v1/analyze" \
     -H "Content-Type: application/json" \
     -d '{"indicator": "example.com", "description": "Test domain"}'
```

### Method 3: Python Script
```python
import asyncio
from app.services.ioc_parser import IOCParser
from app.services.threat_intel import ThreatIntelService
from app.services.analysis_engine import AnalysisEngine

async def analyze_ioc(indicator):
    parser = IOCParser()
    threat_service = ThreatIntelService()
    engine = AnalysisEngine()
    
    # Parse IOC
    ioc_type, is_valid, error = parser.parse_ioc(indicator)
    if not is_valid:
        print(f"Error: {error}")
        return
    
    # Get threat intelligence
    results = await threat_service.analyze_ioc(indicator, ioc_type.value)
    
    # Analyze results
    analysis = engine.analyze_results(results)
    
    print(f"Verdict: {analysis['verdict']}")
    print(f"Threat Score: {analysis['threat_score']:.1f}/100")
    print(f"Confidence: {analysis['confidence_score']:.1%}")
    
    await threat_service.close()

# Run analysis
asyncio.run(analyze_ioc("suspicious-domain.com"))
```

## 🎯 Understanding the Results

### Verdicts
- **MALICIOUS** 🚨: High confidence threat detected
- **SUSPICIOUS** ⚠️: Medium confidence threat detected
- **BENIGN** ✅: Low threat level
- **UNKNOWN** ❓: Insufficient data

### Threat Score (0-100)
- **0-20**: Very low threat
- **21-40**: Low threat
- **41-60**: Medium threat
- **61-80**: High threat
- **81-100**: Very high threat

### Confidence Score (0-100%)
- **0-30%**: Low confidence
- **31-60%**: Medium confidence
- **61-90%**: High confidence
- **91-100%**: Very high confidence

## 🔍 Example Analysis

Let's say you analyze `malware.example.com`:

1. **IOC Parser** identifies it as a domain
2. **Threat Intel Services** query:
   - VirusTotal: 15/70 AV engines detect malware
   - AbuseIPDB: 85% abuse confidence
   - OTX: 45 threat reports
3. **Analysis Engine** calculates:
   - Threat Score: 64.9/100
   - Confidence: 85%
   - Verdict: SUSPICIOUS
4. **Evidence** shows:
   - High malware detection rate
   - High abuse confidence
   - Multiple threat reports

## 🚨 Real-World Use Cases

### Security Analysts
- Quick triage of suspicious indicators
- Batch analysis of threat feeds
- Evidence collection for incident reports

### SOC Teams
- Real-time threat assessment
- Integration with SIEM systems
- Automated threat scoring

### Threat Hunters
- IOC validation and enrichment
- Threat intelligence correlation
- Historical analysis tracking

## 🔧 Customization

### Add New Threat Intel Services
1. Create new service class in `app/services/`
2. Implement query methods
3. Add to `ThreatIntelService`
4. Update analysis engine weights

### Modify Scoring Algorithm
1. Edit `app/services/analysis_engine.py`
2. Adjust thresholds and weights
3. Add new scoring factors

### Add New IOC Types
1. Update `app/models/ioc.py`
2. Add parsing logic in `IOCParser`
3. Update validation rules

## 🎉 You're Ready!

Your Threat IOC Analysis Tool is now ready to:
- Parse and validate IOCs
- Query multiple threat intelligence sources
- Generate intelligent threat verdicts
- Provide detailed analysis reports

Start analyzing those suspicious indicators! 🕵️‍♂️
