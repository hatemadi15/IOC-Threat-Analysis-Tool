#!/usr/bin/env python3
"""
Basic malware analysis script for sandbox environment
"""

import os
import sys
import json
import hashlib
import subprocess
import time
from datetime import datetime
import psutil

class SandboxAnalyzer:
    def __init__(self, sample_path, output_dir="/tmp/analysis"):
        self.sample_path = sample_path
        self.output_dir = output_dir
        self.results = {
            "timestamp": datetime.utcnow().isoformat(),
            "sample_path": sample_path,
            "file_info": {},
            "static_analysis": {},
            "dynamic_analysis": {},
            "network_activity": [],
            "file_operations": [],
            "process_activity": []
        }
        
        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)
    
    def calculate_hashes(self):
        """Calculate file hashes"""
        try:
            with open(self.sample_path, 'rb') as f:
                content = f.read()
                
            self.results["file_info"] = {
                "size": len(content),
                "md5": hashlib.md5(content).hexdigest(),
                "sha1": hashlib.sha1(content).hexdigest(),
                "sha256": hashlib.sha256(content).hexdigest()
            }
        except Exception as e:
            self.results["file_info"]["error"] = str(e)
    
    def static_analysis(self):
        """Perform static analysis"""
        try:
            # File type detection
            result = subprocess.run(['file', self.sample_path], 
                                  capture_output=True, text=True)
            self.results["static_analysis"]["file_type"] = result.stdout.strip()
            
            # Strings extraction
            result = subprocess.run(['strings', self.sample_path], 
                                  capture_output=True, text=True)
            strings = result.stdout.strip().split('\n')[:100]  # Limit to first 100 strings
            self.results["static_analysis"]["strings"] = strings
            
            # Check for packed executables
            if any(packer in result.stdout.lower() for packer in ['upx', 'aspack', 'themida']):
                self.results["static_analysis"]["packed"] = True
            else:
                self.results["static_analysis"]["packed"] = False
                
        except Exception as e:
            self.results["static_analysis"]["error"] = str(e)
    
    def monitor_system(self, duration=30):
        """Monitor system activity during execution"""
        start_time = time.time()
        
        # Get initial process list
        initial_processes = set(p.pid for p in psutil.process_iter())
        
        while time.time() - start_time < duration:
            try:
                # Monitor new processes
                current_processes = set(p.pid for p in psutil.process_iter())
                new_processes = current_processes - initial_processes
                
                for pid in new_processes:
                    try:
                        proc = psutil.Process(pid)
                        self.results["process_activity"].append({
                            "pid": pid,
                            "name": proc.name(),
                            "cmdline": proc.cmdline(),
                            "timestamp": datetime.utcnow().isoformat()
                        })
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        pass
                
                # Monitor network connections
                for conn in psutil.net_connections():
                    if conn.status == 'ESTABLISHED':
                        self.results["network_activity"].append({
                            "local_addr": f"{conn.laddr.ip}:{conn.laddr.port}",
                            "remote_addr": f"{conn.raddr.ip}:{conn.raddr.port}" if conn.raddr else None,
                            "status": conn.status,
                            "timestamp": datetime.utcnow().isoformat()
                        })
                
                time.sleep(1)
                
            except Exception as e:
                print(f"Monitoring error: {e}")
                break
    
    def execute_sample(self):
        """Execute the sample in a controlled manner"""
        try:
            # Make the sample executable if it's not already
            os.chmod(self.sample_path, 0o755)
            
            # Start monitoring in background
            import threading
            monitor_thread = threading.Thread(target=self.monitor_system, args=(30,))
            monitor_thread.start()
            
            # Execute the sample
            start_time = time.time()
            try:
                result = subprocess.run([self.sample_path], 
                                      timeout=30, 
                                      capture_output=True, 
                                      text=True)
                self.results["dynamic_analysis"]["execution_time"] = time.time() - start_time
                self.results["dynamic_analysis"]["return_code"] = result.returncode
                self.results["dynamic_analysis"]["stdout"] = result.stdout
                self.results["dynamic_analysis"]["stderr"] = result.stderr
                
            except subprocess.TimeoutExpired:
                self.results["dynamic_analysis"]["execution_time"] = 30
                self.results["dynamic_analysis"]["timeout"] = True
                
            except Exception as e:
                self.results["dynamic_analysis"]["execution_error"] = str(e)
            
            # Wait for monitoring to complete
            monitor_thread.join()
            
        except Exception as e:
            self.results["dynamic_analysis"]["error"] = str(e)
    
    def generate_report(self):
        """Generate analysis report"""
        report_path = os.path.join(self.output_dir, "analysis_report.json")
        
        with open(report_path, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        return report_path
    
    def run_analysis(self):
        """Run complete analysis"""
        print(f"Starting analysis of {self.sample_path}")
        
        # Static analysis
        print("Calculating hashes...")
        self.calculate_hashes()
        
        print("Performing static analysis...")
        self.static_analysis()
        
        # Dynamic analysis
        print("Starting dynamic analysis...")
        self.execute_sample()
        
        # Generate report
        print("Generating report...")
        report_path = self.generate_report()
        
        print(f"Analysis complete. Report saved to: {report_path}")
        return report_path

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 analyze.py <sample_path>")
        sys.exit(1)
    
    sample_path = sys.argv[1]
    
    if not os.path.exists(sample_path):
        print(f"Error: Sample file {sample_path} not found")
        sys.exit(1)
    
    analyzer = SandboxAnalyzer(sample_path)
    analyzer.run_analysis()

if __name__ == "__main__":
    main()
