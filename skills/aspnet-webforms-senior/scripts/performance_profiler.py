#!/usr/bin/env python3
"""
Performance Profiler for ASP.NET Web Forms
Analyzes page load performance and provides optimization recommendations
"""

import sys
import re
from pathlib import Path

class PerformanceProfiler:
    def __init__(self, directory):
        self.directory = directory
        self.metrics = {}
        
    def profile(self):
        """Profile all ASPX pages"""
        print(f"Profiling directory: {self.directory}")
        print("="*60)
        
        for filepath in Path(self.directory).rglob('*.aspx'):
            self.profile_page(filepath)
        
        self.print_report()
    
    def profile_page(self, filepath):
        """Profile individual page"""
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                
            # Check code-behind file
            cs_file = filepath.with_suffix('.aspx.cs')
            cs_content = ""
            if cs_file.exists():
                with open(cs_file, 'r', encoding='utf-8', errors='ignore') as f:
                    cs_content = f.read()
            
            metrics = {
                'file': str(filepath),
                'viewstate_enabled': self.check_viewstate(content),
                'output_cache': self.check_output_cache(content),
                'server_controls': self.count_server_controls(content),
                'updatepanels': self.count_updatepanels(content),
                'database_calls': self.count_database_calls(cs_content),
                'async_operations': self.check_async(cs_content),
                'issues': []
            }
            
            # Analyze metrics
            self.analyze_metrics(metrics)
            
            self.metrics[str(filepath)] = metrics
            
        except Exception as e:
            print(f"Error profiling {filepath}: {e}")
    
    def check_viewstate(self, content):
        """Check if ViewState is enabled"""
        if 'EnableViewState="false"' in content:
            return False
        return True
    
    def check_output_cache(self, content):
        """Check if output caching is configured"""
        return bool(re.search(r'OutputCache', content, re.IGNORECASE))
    
    def count_server_controls(self, content):
        """Count server controls"""
        return len(re.findall(r'<asp:', content, re.IGNORECASE))
    
    def count_updatepanels(self, content):
        """Count UpdatePanels"""
        return len(re.findall(r'<asp:UpdatePanel', content, re.IGNORECASE))
    
    def count_database_calls(self, content):
        """Count database calls in code-behind"""
        patterns = [
            r'SqlCommand',
            r'SqlConnection',
            r'ExecuteReader',
            r'ExecuteNonQuery',
            r'ExecuteScalar',
        ]
        
        count = 0
        for pattern in patterns:
            count += len(re.findall(pattern, content, re.IGNORECASE))
        
        return count
    
    def check_async(self, content):
        """Check for async operations"""
        return bool(re.search(r'async\s+Task|await\s+', content))
    
    def analyze_metrics(self, metrics):
        """Analyze metrics and identify issues"""
        # ViewState check
        if metrics['viewstate_enabled'] and metrics['server_controls'] > 20:
            metrics['issues'].append({
                'severity': 'HIGH',
                'message': f"ViewState enabled with {metrics['server_controls']} server controls - consider disabling for read-only controls"
            })
        
        # Output cache check
        if not metrics['output_cache'] and metrics['database_calls'] > 0:
            metrics['issues'].append({
                'severity': 'MEDIUM',
                'message': "No output caching configured - consider adding for static content"
            })
        
        # UpdatePanel check
        if metrics['updatepanels'] > 5:
            metrics['issues'].append({
                'severity': 'MEDIUM',
                'message': f"{metrics['updatepanels']} UpdatePanels detected - excessive use can degrade performance"
            })
        
        # Database calls check
        if metrics['database_calls'] > 10:
            metrics['issues'].append({
                'severity': 'HIGH',
                'message': f"{metrics['database_calls']} database operations detected - possible N+1 query problem"
            })
        
        # Async check
        if metrics['database_calls'] > 0 and not metrics['async_operations']:
            metrics['issues'].append({
                'severity': 'LOW',
                'message': "Database operations detected but no async/await - consider using async for I/O operations"
            })
    
    def print_report(self):
        """Print performance report"""
        print(f"\n{'='*60}")
        print("PERFORMANCE PROFILE REPORT")
        print(f"{'='*60}\n")
        
        total_issues = sum(len(m['issues']) for m in self.metrics.values())
        print(f"Pages analyzed: {len(self.metrics)}")
        print(f"Total issues found: {total_issues}\n")
        
        # Print page-by-page analysis
        for filepath, metrics in self.metrics.items():
            if metrics['issues']:
                print(f"\n{'-'*60}")
                print(f"File: {Path(filepath).name}")
                print(f"{'-'*60}")
                print(f"ViewState: {'Enabled' if metrics['viewstate_enabled'] else 'Disabled'}")
                print(f"Output Cache: {'Yes' if metrics['output_cache'] else 'No'}")
                print(f"Server Controls: {metrics['server_controls']}")
                print(f"UpdatePanels: {metrics['updatepanels']}")
                print(f"Database Operations: {metrics['database_calls']}")
                print(f"Async Operations: {'Yes' if metrics['async_operations'] else 'No'}")
                
                print("\nIssues:")
                for issue in metrics['issues']:
                    print(f"  [{issue['severity']}] {issue['message']}")
        
        print(f"\n{'='*60}")
        print("OPTIMIZATION RECOMMENDATIONS:")
        print(f"{'='*60}")
        print("1. Disable ViewState for read-only controls")
        print("2. Implement output caching for static pages")
        print("3. Use data caching for frequently accessed data")
        print("4. Minimize UpdatePanel usage")
        print("5. Use eager loading to avoid N+1 queries")
        print("6. Implement async/await for I/O operations")
        print("7. Enable bundling and minification")
        print("8. Use CDN for static resources")
        print("9. Implement paging for large datasets")
        print("10. Profile with MiniProfiler or ANTS Profiler")

def main():
    if len(sys.argv) < 2:
        print("Usage: python performance_profiler.py <directory>")
        print("\nExample:")
        print("  python performance_profiler.py /path/to/webforms/project")
        sys.exit(1)
    
    directory = sys.argv[1]
    
    if not Path(directory).is_dir():
        print(f"Error: {directory} is not a valid directory")
        sys.exit(1)
    
    profiler = PerformanceProfiler(directory)
    profiler.profile()

if __name__ == "__main__":
    main()
