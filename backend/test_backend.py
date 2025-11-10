import requests
import json

BASE_URL = "http://localhost:5000"

def test_health():
    response = requests.get(f"{BASE_URL}/api/health")
    print(f"Health Check: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def test_register():
    data = {
        "username": "newuser123",
        "email": "newuser123@example.com",
        "password": "simplepass"
    }
    try:
        response = requests.post(f"{BASE_URL}/api/auth/register", json=data)
        print(f"\nRegistration: {response.status_code}")
        if response.status_code == 201:
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")

def test_ml_predict():
    data = {
        "location": "Downtown",
        "property_type": "Apartment",
        "bedrooms": 2,
        "bathrooms": 2,
        "area": 1200,
        "year_built": 2015,
        "condition": "Good"
    }
    try:
        response = requests.post(f"{BASE_URL}/api/predict", json=data)
        print(f"\nML Prediction: {response.status_code}")
        if response.status_code == 200:
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    print("=" * 50)
    print("Testing Restmage Backend")
    print("=" * 50)
    test_health()
    test_register()
    test_ml_predict()
