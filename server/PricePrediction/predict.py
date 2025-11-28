#!/usr/bin/env python
"""
Prediction wrapper for House Price Prediction.
Manually handles encoding because the training script overwrote the encoder.
"""
import os
import sys
import json
import pickle
import datetime

try:
    import joblib
except Exception:
    joblib = None

try:
    import pandas as pd
except Exception:
    pd = None

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def load_artifact(name):
    path = os.path.join(BASE_DIR, name)
    if not os.path.exists(path):
        return None
    try:
        if joblib and name.endswith('.pkl'):
            return joblib.load(path)
        with open(path, 'rb') as f:
            return pickle.load(f)
    except Exception:
        with open(path, 'rb') as f:
            return pickle.load(f)

# Mappings derived from dataset
LOCATION_MAP = {'Downtown': 0, 'Rural': 1, 'Suburban': 2, 'Urban': 3}
CONDITION_MAP = {'Excellent': 0, 'Fair': 1, 'Good': 2, 'Poor': 3}
GARAGE_MAP = {'No': 0, 'Yes': 1}

def get_encoded_value(mapping, value, default_key):
    # Case-insensitive match
    if isinstance(value, str):
        for k, v in mapping.items():
            if k.lower() == value.lower():
                return v
    return mapping.get(default_key, 0)

def main():
    try:
        # Read input from stdin
        try:
            payload = json.load(sys.stdin)
        except Exception:
            # If run without input, use dummy data for testing
            payload = {}
            
        model = load_artifact('model.pkl')
        if model is None:
            print(json.dumps({'error': 'model not found'}))
            sys.exit(3)

        # Extract features
        # Expected order: Area, Bedrooms, Bathrooms, Floors, YearBuilt, Location, Condition, Garage
        
        area = float(payload.get('area', 0) or 0)
        bedrooms = float(payload.get('bedrooms', 0) or 0)
        bathrooms = float(payload.get('bathrooms', 0) or 0)
        floors = float(payload.get('floors', 1) or 1) # Default to 1 floor if not provided
        
        # Handle Age -> YearBuilt
        current_year = datetime.datetime.now().year
        age = float(payload.get('age', 0) or 0)
        year_built = current_year - age
        
        # Encode categorical
        location_raw = payload.get('location', 'Downtown')
        location_enc = get_encoded_value(LOCATION_MAP, location_raw, 'Downtown')
        
        condition_raw = payload.get('condition', 'Fair')
        condition_enc = get_encoded_value(CONDITION_MAP, condition_raw, 'Fair')
        
        # Garage
        # Check explicit 'garage' field or 'amenities' list
        garage_raw = payload.get('garage')
        if garage_raw is None:
            amenities = payload.get('amenities', [])
            if 'garage' in [a.lower() for a in amenities]:
                garage_raw = 'Yes'
            else:
                garage_raw = 'No'
        
        garage_enc = get_encoded_value(GARAGE_MAP, str(garage_raw), 'No')

        # Construct feature vector
        features = [area, bedrooms, bathrooms, floors, year_built, location_enc, condition_enc, garage_enc]
        
        # Predict
        # Reshape to 2D array (1 sample)
        X = [features]
        
        try:
            pred = model.predict(X)
        except Exception as ex:
            print(json.dumps({'error': 'model prediction failed', 'detail': str(ex)}))
            sys.exit(4)

        # Output
        if hasattr(pred, '__iter__'):
            predicted = float(pred[0])
        else:
            predicted = float(pred)

        output = {
            'predicted_price': predicted,
            'currency': 'INR',
            'symbol': '\u20B9'
        }
        print(json.dumps(output))

    except Exception as e:
        print(json.dumps({'error': 'unexpected error', 'detail': str(e)}))
        sys.exit(5)

if __name__ == '__main__':
    main()
