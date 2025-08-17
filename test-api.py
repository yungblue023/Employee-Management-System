#!/usr/bin/env python3
"""
Test script for Employee Management System API
Run this after starting the backend server to verify everything works
"""

import requests
import json
import sys
from datetime import datetime

BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/v1"

def test_health_check():
    """Test health check endpoint"""
    print("🔍 Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Is it running?")
        return False

def test_create_employee():
    """Test creating a new employee"""
    print("🔍 Testing employee creation...")
    
    employee_data = {
        "employee_id": "EMP001",
        "name": "John Doe",
        "age": 30,
        "department": "Engineering"
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/employees/",
            json=employee_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 201:
            print("✅ Employee created successfully")
            print(f"   Created: {response.json()}")
            return True
        else:
            print(f"❌ Failed to create employee: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error creating employee: {e}")
        return False

def test_get_employees():
    """Test getting all employees"""
    print("🔍 Testing get all employees...")
    
    try:
        response = requests.get(f"{API_BASE}/employees/")
        
        if response.status_code == 200:
            employees = response.json()
            print(f"✅ Retrieved {len(employees)} employees")
            return True
        else:
            print(f"❌ Failed to get employees: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error getting employees: {e}")
        return False

def test_dashboard_stats():
    """Test dashboard statistics"""
    print("🔍 Testing dashboard statistics...")
    
    try:
        response = requests.get(f"{API_BASE}/employees/dashboard")
        
        if response.status_code == 200:
            stats = response.json()
            print("✅ Dashboard stats retrieved")
            print(f"   Total employees: {stats.get('total_employees', 0)}")
            print(f"   Recent employees: {stats.get('recent_employees', 0)}")
            return True
        else:
            print(f"❌ Failed to get dashboard stats: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error getting dashboard stats: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Employee Management System API Test")
    print("=" * 50)
    
    tests = [
        test_health_check,
        test_create_employee,
        test_get_employees,
        test_dashboard_stats
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! API is working correctly.")
        sys.exit(0)
    else:
        print("⚠️  Some tests failed. Check the server and database connection.")
        sys.exit(1)

if __name__ == "__main__":
    main()
