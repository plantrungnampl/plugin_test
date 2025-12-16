#!/usr/bin/env python3
"""
ViewState Analyzer for ASP.NET Web Forms
Analyzes ViewState size and contents to identify optimization opportunities
"""

import base64
import sys
from urllib.parse import unquote

def decode_viewstate(viewstate_str):
    """Decode base64 ViewState string"""
    try:
        # URL decode first
        decoded = unquote(viewstate_str)
        # Base64 decode
        viewstate_bytes = base64.b64decode(decoded)
        return viewstate_bytes
    except Exception as e:
        print(f"Error decoding ViewState: {e}")
        return None

def analyze_viewstate(viewstate_bytes):
    """Analyze ViewState content and size"""
    if not viewstate_bytes:
        return
    
    size = len(viewstate_bytes)
    print(f"\n{'='*60}")
    print(f"ViewState Analysis")
    print(f"{'='*60}")
    print(f"Total Size: {size:,} bytes ({size/1024:.2f} KB)")
    
    # Size recommendations
    if size < 10000:
        print("✓ ViewState size is acceptable (< 10KB)")
    elif size < 50000:
        print("⚠ ViewState size is getting large (10-50KB)")
        print("  Consider disabling ViewState for read-only controls")
    else:
        print("✗ ViewState size is too large (> 50KB)")
        print("  URGENT: Disable ViewState or implement compression")
    
    # Check for common patterns
    print(f"\nViewState Type Indicators:")
    
    # Look for control state patterns
    patterns = {
        'DataGrid/GridView': b'\x12\x00',
        'Repeater': b'\x0f\x00',
        'TextBox': b'\x0d\x00',
        'DropDownList': b'\x0e\x00',
        'Hidden Fields': b'\x10\x00'
    }
    
    for name, pattern in patterns.items():
        count = viewstate_bytes.count(pattern)
        if count > 0:
            print(f"  - {name}: {count} instance(s)")
    
    print(f"\n{'='*60}")
    print("Optimization Recommendations:")
    print(f"{'='*60}")
    
    if size > 10000:
        print("1. Disable ViewState for read-only controls:")
        print("   - Labels, Literals, static text")
        print("   - GridView/DataGrid with read-only data")
        print("\n2. Consider ViewState compression:")
        print("   - Override SaveViewState/LoadViewState")
        print("   - Use LZ4 or GZip compression")
        print("\n3. Move data to Session/Cache:")
        print("   - Large objects should use Session")
        print("   - Shared data should use Cache")
        print("\n4. Use ControlState for critical data:")
        print("   - Smaller and more secure than ViewState")

def main():
    if len(sys.argv) < 2:
        print("Usage: python analyze_viewstate.py <viewstate_string>")
        print("\nExample:")
        print('  python analyze_viewstate.py "/wEPDwUK....."')
        sys.exit(1)
    
    viewstate_str = sys.argv[1]
    viewstate_bytes = decode_viewstate(viewstate_str)
    
    if viewstate_bytes:
        analyze_viewstate(viewstate_bytes)
    else:
        print("Failed to decode ViewState")
        sys.exit(1)

if __name__ == "__main__":
    main()
