import asyncio
import aiohttp
import csv
import json
import xml.etree.ElementTree as ET
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import uuid
import sqlite3
import os
from pathlib import Path

class ThreatFeedService:
    """Service for managing and ingesting threat intelligence feeds"""
    
    def __init__(self, db_path: str = "threat_feeds.db"):
        self.db_path = db_path
        self.active_feeds = {}
        self.feed_configs = {}
        self.initialize_database()
        
    def initialize_database(self):
        """Initialize the threat feeds database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create feeds table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS feeds (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                url TEXT NOT NULL,
                format TEXT NOT NULL,
                update_interval INTEGER NOT NULL,
                auth_token TEXT,
                last_update TIMESTAMP,
                record_count INTEGER DEFAULT 0,
                error_count INTEGER DEFAULT 0,
                status TEXT DEFAULT 'inactive',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create indicators table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS indicators (
                id TEXT PRIMARY KEY,
                feed_id TEXT NOT NULL,
                ioc_type TEXT NOT NULL,
                value TEXT NOT NULL,
                confidence INTEGER,
                threat_level TEXT,
                description TEXT,
                tags TEXT,
                first_seen TIMESTAMP,
                last_seen TIMESTAMP,
                FOREIGN KEY (feed_id) REFERENCES feeds (id)
            )
        ''')
        
        # Create index for faster lookups
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_indicators_value ON indicators(value)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_indicators_type ON indicators(ioc_type)')
        
        conn.commit()
        conn.close()
    
    async def add_feed(self, feed_config: Dict[str, Any]) -> Dict[str, Any]:
        """Add a new threat intelligence feed"""
        try:
            feed_id = str(uuid.uuid4())
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO feeds (id, name, url, format, update_interval, auth_token)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                feed_id,
                feed_config['name'],
                feed_config['url'],
                feed_config['format'],
                int(float(feed_config['interval']) * 3600),  # Convert hours to seconds
                feed_config.get('auth', '')
            ))
            
            conn.commit()
            conn.close()
            
            # Store in memory for quick access
            self.feed_configs[feed_id] = feed_config
            
            return {
                "feed_id": feed_id,
                "status": "created",
                "message": "Threat feed added successfully"
            }
            
        except Exception as e:
            return {
                "error": str(e),
                "status": "failed"
            }
    
    async def update_feed(self, feed_id: str) -> Dict[str, Any]:
        """Update a specific threat intelligence feed"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get feed configuration
            cursor.execute('SELECT * FROM feeds WHERE id = ?', (feed_id,))
            feed_row = cursor.fetchone()
            
            if not feed_row:
                return {"error": "Feed not found", "status": "not_found"}
            
            # Extract feed info
            _, name, url, format_type, interval, auth_token, _, _, _, status, _ = feed_row
            
            # Download and process feed
            indicators = await self._download_and_parse_feed(url, format_type, auth_token)
            
            # Clear existing indicators for this feed
            cursor.execute('DELETE FROM indicators WHERE feed_id = ?', (feed_id,))
            
            # Insert new indicators
            for indicator in indicators:
                cursor.execute('''
                    INSERT OR REPLACE INTO indicators 
                    (id, feed_id, ioc_type, value, confidence, threat_level, description, tags, first_seen, last_seen)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    str(uuid.uuid4()),
                    feed_id,
                    indicator.get('type', 'unknown'),
                    indicator['value'],
                    indicator.get('confidence', 50),
                    indicator.get('threat_level', 'medium'),
                    indicator.get('description', ''),
                    json.dumps(indicator.get('tags', [])),
                    indicator.get('first_seen', datetime.utcnow().isoformat()),
                    datetime.utcnow().isoformat()
                ))
            
            # Update feed metadata
            cursor.execute('''
                UPDATE feeds 
                SET last_update = ?, record_count = ?, status = 'active'
                WHERE id = ?
            ''', (datetime.utcnow().isoformat(), len(indicators), feed_id))
            
            conn.commit()
            conn.close()
            
            return {
                "feed_id": feed_id,
                "status": "updated",
                "records_imported": len(indicators),
                "last_update": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            # Update error count
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE feeds 
                SET error_count = error_count + 1, status = 'error'
                WHERE id = ?
            ''', (feed_id,))
            conn.commit()
            conn.close()
            
            return {
                "error": str(e),
                "status": "failed",
                "feed_id": feed_id
            }
    
    async def _download_and_parse_feed(self, url: str, format_type: str, auth_token: str = None) -> List[Dict[str, Any]]:
        """Download and parse a threat intelligence feed"""
        headers = {}
        if auth_token:
            headers['Authorization'] = f'Bearer {auth_token}'
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status != 200:
                    raise Exception(f"Failed to download feed: HTTP {response.status}")
                
                content = await response.text()
                
                if format_type.lower() == 'json':
                    return self._parse_json_feed(content)
                elif format_type.lower() == 'csv':
                    return self._parse_csv_feed(content)
                elif format_type.lower() == 'xml':
                    return self._parse_xml_feed(content)
                elif format_type.lower() == 'stix':
                    return self._parse_stix_feed(content)
                else:
                    raise Exception(f"Unsupported feed format: {format_type}")
    
    def _parse_json_feed(self, content: str) -> List[Dict[str, Any]]:
        """Parse JSON format threat feed"""
        try:
            data = json.loads(content)
            indicators = []
            
            # Handle different JSON structures
            if isinstance(data, list):
                # Direct list of indicators
                for item in data:
                    indicator = self._normalize_indicator(item)
                    if indicator:
                        indicators.append(indicator)
            elif isinstance(data, dict):
                # Check for common field names
                for key in ['indicators', 'iocs', 'threats', 'data']:
                    if key in data and isinstance(data[key], list):
                        for item in data[key]:
                            indicator = self._normalize_indicator(item)
                            if indicator:
                                indicators.append(indicator)
                        break
            
            return indicators
            
        except json.JSONDecodeError as e:
            raise Exception(f"Invalid JSON format: {e}")
    
    def _parse_csv_feed(self, content: str) -> List[Dict[str, Any]]:
        """Parse CSV format threat feed"""
        indicators = []
        lines = content.strip().split('\n')
        
        if not lines:
            return indicators
        
        # Try to detect CSV format
        reader = csv.DictReader(lines)
        
        for row in reader:
            indicator = self._normalize_indicator(row)
            if indicator:
                indicators.append(indicator)
        
        return indicators
    
    def _parse_xml_feed(self, content: str) -> List[Dict[str, Any]]:
        """Parse XML format threat feed"""
        indicators = []
        
        try:
            root = ET.fromstring(content)
            
            # Handle common XML structures
            for item in root.findall('.//indicator') or root.findall('.//ioc') or root.findall('.//threat'):
                indicator_data = {}
                for child in item:
                    indicator_data[child.tag] = child.text
                
                indicator = self._normalize_indicator(indicator_data)
                if indicator:
                    indicators.append(indicator)
            
            return indicators
            
        except ET.ParseError as e:
            raise Exception(f"Invalid XML format: {e}")
    
    def _parse_stix_feed(self, content: str) -> List[Dict[str, Any]]:
        """Parse STIX format threat feed"""
        # Basic STIX parsing - in production you'd use a proper STIX library
        try:
            data = json.loads(content)
            indicators = []
            
            if 'objects' in data:
                for obj in data['objects']:
                    if obj.get('type') == 'indicator':
                        pattern = obj.get('pattern', '')
                        # Extract IOC from STIX pattern
                        if 'file:hashes.MD5' in pattern:
                            value = pattern.split("'")[1]
                            indicators.append({
                                'value': value,
                                'type': 'hash_md5',
                                'confidence': 75,
                                'threat_level': 'medium',
                                'description': obj.get('name', ''),
                                'tags': obj.get('labels', [])
                            })
                        elif 'domain-name:value' in pattern:
                            value = pattern.split("'")[1]
                            indicators.append({
                                'value': value,
                                'type': 'domain',
                                'confidence': 75,
                                'threat_level': 'medium',
                                'description': obj.get('name', ''),
                                'tags': obj.get('labels', [])
                            })
            
            return indicators
            
        except json.JSONDecodeError as e:
            raise Exception(f"Invalid STIX format: {e}")
    
    def _normalize_indicator(self, raw_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Normalize an indicator from various feed formats"""
        if not raw_data:
            return None
        
        # Try to extract the IOC value from various field names
        value = None
        ioc_type = None
        
        # Common field names for IOC values
        value_fields = ['value', 'indicator', 'ioc', 'observable', 'artifact', 'domain', 'ip', 'hash', 'url']
        for field in value_fields:
            if field in raw_data and raw_data[field]:
                value = str(raw_data[field]).strip()
                break
        
        if not value:
            return None
        
        # Determine IOC type based on value format
        if value.count('.') == 3 and all(part.isdigit() and 0 <= int(part) <= 255 for part in value.split('.')):
            ioc_type = 'ip_address'
        elif value.startswith('http://') or value.startswith('https://'):
            ioc_type = 'url'
        elif '@' in value and '.' in value:
            ioc_type = 'email'
        elif len(value) == 32 and all(c in '0123456789abcdef' for c in value.lower()):
            ioc_type = 'hash_md5'
        elif len(value) == 40 and all(c in '0123456789abcdef' for c in value.lower()):
            ioc_type = 'hash_sha1'
        elif len(value) == 64 and all(c in '0123456789abcdef' for c in value.lower()):
            ioc_type = 'hash_sha256'
        elif '.' in value and not value.startswith('http'):
            ioc_type = 'domain'
        else:
            ioc_type = 'unknown'
        
        # Extract other fields
        confidence = raw_data.get('confidence', raw_data.get('score', 50))
        if isinstance(confidence, str):
            try:
                confidence = int(confidence)
            except ValueError:
                confidence = 50
        
        threat_level = raw_data.get('threat_level', raw_data.get('severity', 'medium')).lower()
        if threat_level not in ['low', 'medium', 'high']:
            threat_level = 'medium'
        
        description = raw_data.get('description', raw_data.get('comment', ''))
        tags = raw_data.get('tags', raw_data.get('labels', []))
        if isinstance(tags, str):
            tags = [tag.strip() for tag in tags.split(',')]
        
        return {
            'value': value,
            'type': ioc_type,
            'confidence': confidence,
            'threat_level': threat_level,
            'description': description,
            'tags': tags
        }
    
    async def search_indicators(self, ioc_value: str, ioc_type: str = None) -> List[Dict[str, Any]]:
        """Search for indicators in the local threat feed database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        if ioc_type:
            cursor.execute('''
                SELECT i.*, f.name as feed_name 
                FROM indicators i
                JOIN feeds f ON i.feed_id = f.id
                WHERE i.value = ? AND i.ioc_type = ?
            ''', (ioc_value, ioc_type))
        else:
            cursor.execute('''
                SELECT i.*, f.name as feed_name 
                FROM indicators i
                JOIN feeds f ON i.feed_id = f.id
                WHERE i.value = ?
            ''', (ioc_value,))
        
        results = cursor.fetchall()
        conn.close()
        
        indicators = []
        for row in results:
            indicators.append({
                'id': row[0],
                'feed_id': row[1],
                'feed_name': row[11],
                'ioc_type': row[2],
                'value': row[3],
                'confidence': row[4],
                'threat_level': row[5],
                'description': row[6],
                'tags': json.loads(row[7]) if row[7] else [],
                'first_seen': row[8],
                'last_seen': row[9]
            })
        
        return indicators
    
    async def get_feed_stats(self) -> Dict[str, Any]:
        """Get threat feed statistics"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get feed counts
        cursor.execute('SELECT COUNT(*) FROM feeds')
        total_feeds = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM feeds WHERE status = "active"')
        active_feeds = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM indicators')
        total_indicators = cursor.fetchone()[0]
        
        # Get indicators by type
        cursor.execute('''
            SELECT ioc_type, COUNT(*) 
            FROM indicators 
            GROUP BY ioc_type
        ''')
        indicators_by_type = dict(cursor.fetchall())
        
        # Get most recent update
        cursor.execute('SELECT MAX(last_update) FROM feeds')
        last_update = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            'total_feeds': total_feeds,
            'active_feeds': active_feeds,
            'total_indicators': total_indicators,
            'indicators_by_type': indicators_by_type,
            'last_update': last_update
        }
    
    async def list_feeds(self) -> List[Dict[str, Any]]:
        """List all configured threat feeds"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM feeds ORDER BY created_at DESC')
        results = cursor.fetchall()
        conn.close()
        
        feeds = []
        for row in results:
            feeds.append({
                'id': row[0],
                'name': row[1],
                'url': row[2],
                'format': row[3],
                'update_interval': row[4],
                'last_update': row[6],
                'record_count': row[7],
                'error_count': row[8],
                'status': row[9],
                'created_at': row[10]
            })
        
        return feeds
    
    async def delete_feed(self, feed_id: str) -> Dict[str, Any]:
        """Delete a threat intelligence feed"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Delete indicators first
            cursor.execute('DELETE FROM indicators WHERE feed_id = ?', (feed_id,))
            
            # Delete feed
            cursor.execute('DELETE FROM feeds WHERE id = ?', (feed_id,))
            
            if cursor.rowcount == 0:
                return {"error": "Feed not found", "status": "not_found"}
            
            conn.commit()
            conn.close()
            
            return {
                "feed_id": feed_id,
                "status": "deleted",
                "message": "Threat feed deleted successfully"
            }
            
        except Exception as e:
            return {
                "error": str(e),
                "status": "failed"
            }
    
    async def update_all_feeds(self) -> Dict[str, Any]:
        """Update all active threat intelligence feeds"""
        feeds = await self.list_feeds()
        results = []
        
        for feed in feeds:
            if feed['status'] == 'active':
                result = await self.update_feed(feed['id'])
                results.append({
                    'feed_id': feed['id'],
                    'name': feed['name'],
                    'result': result
                })
        
        return {
            'updated_feeds': len(results),
            'results': results
        }
