# 🚀 Threat IOC Analysis Tool

A unified threat intelligence platform that analyzes various IOCs (Indicators of Compromise) and provides automated triage with confidence scoring.

## 🎯 Features

- **Multi-format IOC Support**: URLs, domains, IP addresses, file hashes, email addresses
- **OSINT Integration**: VirusTotal, AbuseIPDB, URLScan.io, AlienVault OTX, and more
- **Intelligent Analysis**: Reputation scoring with confidence levels
- **Unified Workflow**: Single interface for all threat intelligence queries
- **Real-time Processing**: Async analysis with caching and rate limiting

## 🏗️ Architecture

- **Backend**: FastAPI with async processing
- **Database**: SQLite/PostgreSQL with SQLAlchemy
- **Cache**: Redis for rate limiting and caching
- **Frontend**: React/Next.js (coming soon)

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Redis server
- API keys for threat intelligence services

### Installation

1. Clone the repository:
```bash
git clone <your-repo>
cd chimera
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys
```

5. Run the application:
```bash
uvicorn main:app --reload
```

## 🔑 API Keys Required

- VirusTotal API key
- AbuseIPDB API key
- URLScan.io API key
- AlienVault OTX API key

## 📖 API Documentation

Once running, visit `http://localhost:8000/docs` for interactive API documentation.

## 🤝 Contributing

This is a hackathon project. Feel free to contribute and improve!

## 📄 License

MIT License
