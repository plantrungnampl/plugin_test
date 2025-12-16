#!/usr/bin/env python3
"""
Security Audit Tool for ASP.NET Web Forms
Scans code for common security vulnerabilities
"""

import os
import re
import sys
from pathlib import Path

class SecurityAuditor:
    def __init__(self, directory):
        self.directory = directory
        self.issues = []
        
    def scan(self):
        """Scan all .aspx, .aspx.cs, and .cs files"""
        print(f"Scanning directory: {self.directory}")
        print("="*60)
        
        for ext in ['.aspx', '.cs']:
            for filepath in Path(self.directory).rglob(f'*{ext}'):
                self.scan_file(filepath)
        
        self.print_report()
    
    def scan_file(self, filepath):
        """Scan individual file for security issues"""
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                lines = content.split('\n')
                
                # Check for various security issues
                self.check_sql_injection(filepath, lines)
                self.check_xss(filepath, lines)
                self.check_viewstate_security(filepath, content)
                self.check_authentication(filepath, content)
                self.check_sensitive_data(filepath, lines)
                self.check_error_handling(filepath, content)
                
        except Exception as e:
            print(f"Error scanning {filepath}: {e}")
    
    def check_sql_injection(self, filepath, lines):
        """Check for SQL injection vulnerabilities"""
        patterns = [
            (r'SqlCommand.*\+.*Request', 'SQL injection: String concatenation with Request data'),
            (r'SqlCommand.*\+.*QueryString', 'SQL injection: String concatenation with QueryString'),
            (r'SqlCommand.*\+.*Form\[', 'SQL injection: String concatenation with Form data'),
            (r'"SELECT.*\+', 'SQL injection: String concatenation in SQL query'),
        ]
        
        for i, line in enumerate(lines, 1):
            for pattern, message in patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    self.add_issue('CRITICAL', filepath, i, line.strip(), message)
    
    def check_xss(self, filepath, lines):
        """Check for XSS vulnerabilities"""
        patterns = [
            (r'\.Text\s*=\s*Request\[', 'XSS: Direct assignment from Request without encoding'),
            (r'\.Text\s*=\s*Request\.QueryString', 'XSS: Direct assignment from QueryString without encoding'),
            (r'Response\.Write\(Request', 'XSS: Response.Write with Request data'),
            (r'innerHTML.*Request', 'XSS: Direct HTML injection from Request'),
        ]
        
        for i, line in enumerate(lines, 1):
            for pattern, message in patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    # Check if HtmlEncode is used
                    if not re.search(r'HtmlEncode|AntiXssEncoder', line, re.IGNORECASE):
                        self.add_issue('HIGH', filepath, i, line.strip(), message)
    
    def check_viewstate_security(self, filepath, content):
        """Check ViewState security settings"""
        if '.aspx' in str(filepath):
            if 'enableViewStateMac="false"' in content:
                self.add_issue('HIGH', filepath, 0, '', 
                             'ViewState MAC disabled - vulnerable to tampering')
            
            if 'viewStateEncryptionMode' not in content:
                self.add_issue('MEDIUM', filepath, 0, '', 
                             'ViewState encryption not configured')
    
    def check_authentication(self, filepath, content):
        """Check authentication configuration"""
        if 'web.config' in str(filepath).lower():
            if '<authentication mode="None"' in content:
                self.add_issue('CRITICAL', filepath, 0, '', 
                             'Authentication disabled')
            
            if '<allow users="*"' in content:
                self.add_issue('HIGH', filepath, 0, '', 
                             'Anonymous access allowed globally')
    
    def check_sensitive_data(self, filepath, lines):
        """Check for sensitive data exposure"""
        patterns = [
            (r'password\s*=\s*["\']', 'Hardcoded password detected'),
            (r'connectionString.*password', 'Password in connection string'),
            (r'ViewState\[".*[Pp]assword', 'Password stored in ViewState'),
            (r'ViewState\[".*[Cc]redit', 'Credit card data in ViewState'),
        ]
        
        for i, line in enumerate(lines, 1):
            for pattern, message in patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    self.add_issue('CRITICAL', filepath, i, line.strip(), message)
    
    def check_error_handling(self, filepath, content):
        """Check error handling configuration"""
        if 'web.config' in str(filepath).lower():
            if 'customErrors mode="Off"' in content:
                self.add_issue('HIGH', filepath, 0, '', 
                             'Custom errors disabled - stack traces exposed')
            
            if '<compilation debug="true"' in content:
                self.add_issue('MEDIUM', filepath, 0, '', 
                             'Debug mode enabled in production')
    
    def add_issue(self, severity, filepath, line_num, line_content, message):
        """Add security issue to list"""
        self.issues.append({
            'severity': severity,
            'file': str(filepath),
            'line': line_num,
            'content': line_content,
            'message': message
        })
    
    def print_report(self):
        """Print security audit report"""
        print(f"\n{'='*60}")
        print("SECURITY AUDIT REPORT")
        print(f"{'='*60}\n")
        
        # Group by severity
        critical = [i for i in self.issues if i['severity'] == 'CRITICAL']
        high = [i for i in self.issues if i['severity'] == 'HIGH']
        medium = [i for i in self.issues if i['severity'] == 'MEDIUM']
        
        print(f"Critical Issues: {len(critical)}")
        print(f"High Issues: {len(high)}")
        print(f"Medium Issues: {len(medium)}")
        print(f"Total Issues: {len(self.issues)}\n")
        
        # Print critical issues first
        for severity_level, issues in [('CRITICAL', critical), ('HIGH', high), ('MEDIUM', medium)]:
            if issues:
                print(f"\n{severity_level} ISSUES:")
                print("-"*60)
                for issue in issues:
                    print(f"\nFile: {issue['file']}")
                    if issue['line'] > 0:
                        print(f"Line: {issue['line']}")
                        print(f"Code: {issue['content']}")
                    print(f"Issue: {issue['message']}")
        
        print(f"\n{'='*60}")
        print("RECOMMENDATIONS:")
        print(f"{'='*60}")
        print("1. Fix all CRITICAL issues immediately")
        print("2. Use parameterized queries for all database operations")
        print("3. Encode all user input before output (HtmlEncode, JavaScriptEncode)")
        print("4. Enable ViewState MAC and encryption")
        print("5. Never store sensitive data in ViewState")
        print("6. Enable custom errors in production")
        print("7. Disable debug mode in production")
        print("8. Implement proper authentication and authorization")

def main():
    if len(sys.argv) < 2:
        print("Usage: python security_audit.py <directory>")
        print("\nExample:")
        print("  python security_audit.py /path/to/webforms/project")
        sys.exit(1)
    
    directory = sys.argv[1]
    
    if not os.path.isdir(directory):
        print(f"Error: {directory} is not a valid directory")
        sys.exit(1)
    
    auditor = SecurityAuditor(directory)
    auditor.scan()

if __name__ == "__main__":
    main()
