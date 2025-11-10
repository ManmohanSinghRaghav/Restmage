"""
Test backend API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:5000"

def test_health():
    """Test health endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/api/health")
        print(f"✅ Health check: {response.status_code} - {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_register():
    """Test user registration"""
    payload = {
        "username": "newtestuser",
        "email": "newtestuser@restmage.com",
        "password": "Test123456"
    }
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        if response.status_code == 201:
            data = response.json()
            print(f"✅ Registration successful: {data['user']['username']}")
            return True
        else:
            print(f"❌ Registration failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return False

def test_login():
    """Test user login"""
    payload = {
        "email": "admin@restmage.com",
        "password": "Admin123456"
    }
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Login successful: {data['user']['username']}")
            return True, data['access_token']
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False, None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return False, None

if __name__ == "__main__":
    print("🧪 Testing Backend API...")
    print("-" * 50)
    
    # Test health
    if not test_health():
        print("⚠️  Backend is not running!")
        exit(1)
    
    print()
    
    # Test registration
    test_register()
    
    print()
    
    # Test login
    success, token = test_login()
    
    print()
    print("-" * 50)
    print("✅ Backend tests completed!")
