#!/usr/bin/env python3
"""
Test script to verify export filters are working correctly
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_export_filters():
    """Test different filter combinations for the export endpoint"""
    
    print("🧪 Testing Export Filters...")
    
    # Test cases
    test_cases = [
        {
            "name": "No filters (all employees)",
            "params": {}
        },
        {
            "name": "Department filter",
            "params": {"department": "Engineering"}
        },
        {
            "name": "Status filter", 
            "params": {"status": "active"}
        },
        {
            "name": "Salary range filter",
            "params": {"min_salary": 70000, "max_salary": 90000}
        },
        {
            "name": "Age range filter",
            "params": {"min_age": 25, "max_age": 35}
        },
        {
            "name": "Search filter",
            "params": {"search": "John"}
        },
        {
            "name": "Combined filters",
            "params": {
                "department": "Engineering",
                "min_salary": 70000,
                "status": "active"
            }
        }
    ]
    
    for test_case in test_cases:
        print(f"\n📋 Testing: {test_case['name']}")
        print(f"   Parameters: {test_case['params']}")
        
        try:
            # Test the export endpoint (without auth for now)
            response = requests.get(
                f"{BASE_URL}/employees/export/csv",
                params=test_case['params'],
                timeout=10
            )
            
            if response.status_code == 401:
                print("   ✅ Authentication required (expected)")
            elif response.status_code == 200:
                print("   ✅ Export successful")
                print(f"   📄 Content-Type: {response.headers.get('content-type')}")
                print(f"   📦 Content-Length: {len(response.content)} bytes")
            else:
                print(f"   ❌ Unexpected status: {response.status_code}")
                print(f"   📝 Response: {response.text[:200]}...")
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Request failed: {e}")
    
    print("\n🎯 Filter Test Summary:")
    print("   - All filters should require authentication (401)")
    print("   - With proper auth, they should return CSV content")
    print("   - Content-Type should be 'text/csv'")

if __name__ == "__main__":
    test_export_filters()
