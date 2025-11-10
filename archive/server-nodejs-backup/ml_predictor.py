#!/usr/bin/env python
"""
Simple Python predictor wrapper for Node.js route.
Expects JSON on stdin. Supported payloads:
- { "features": { ... } }  -> single prediction
- { "properties": [ { ... }, { ... } ] } -> batch prediction

Looks for model files next to this script:
- model.pkl
- encoder.pkl (optional)

Outputs JSON to stdout: { "success": true, "predictions": [...], "confidence": 0.9 }
On error prints JSON with success=false and exits with non-zero status.

Dependencies: pandas, numpy, scikit-learn (joblib)
Install: pip install -r requirements.txt  OR pip install pandas numpy scikit-learn joblib
"""

import sys
import os
import json
import traceback

try:
    import joblib
    import pandas as pd
    import numpy as np
except Exception as e:
    err = {"success": False, "error": f"Missing python dependency: {e}"}
    print(json.dumps(err))
    sys.exit(2)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'model.pkl')
ENCODER_PATH = os.path.join(BASE_DIR, 'encoder.pkl')


def load_pickle(path):
    return joblib.load(path)


def preprocess_features(df, encoders):
    """Apply label encoding to categorical columns."""
    label_cols = ['Location', 'Condition', 'Garage']
    df_processed = df.copy()
    
    # Normalize column names to match training
    df_processed.columns = [col[0].upper() + col[1:] for col in df_processed.columns]
    
    # Convert Yes/No or boolean garage to string
    if 'Garage' in df_processed:
        df_processed['Garage'] = df_processed['Garage'].map(lambda x: 
            'Yes' if (isinstance(x, bool) and x) or str(x).lower() == 'yes' or str(x).lower() == 'true'
            else 'No')
    
    # Apply encoding for each categorical column
    for col in label_cols:
        if col in df_processed and encoders and col in encoders:
            try:
                df_processed[col] = encoders[col].transform(df_processed[col])
            except:
                # If encoding fails, try to match closest category or use default
                print(f"Warning: Could not encode {col}, using default value", file=sys.stderr)
                df_processed[col] = 0  # use first category as default
                
    return df_processed

def main():
    try:
        raw = json.load(sys.stdin)
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Failed to read JSON from stdin: {e}"}))
        return sys.exit(3)

    if not os.path.exists(MODEL_PATH):
        print(json.dumps({"success": False, "error": f"Model file not found at {MODEL_PATH}"}))
        return sys.exit(4)

    try:
        model = load_pickle(MODEL_PATH)
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Failed to load model.pkl: {e}", "trace": traceback.format_exc()}))
        return sys.exit(5)

    # Load all available encoders
    encoders = {}
    if os.path.exists(ENCODER_PATH):
        try:
            encoder = load_pickle(ENCODER_PATH)
            # Reconstruct individual column encoders from the saved state
            for col in ['Location', 'Condition', 'Garage']:
                encoders[col] = encoder
        except Exception as e:
            print(f"Warning: Failed to load encoder.pkl: {e}", file=sys.stderr)
            encoders = None

    # prepare data
    items = []
    if isinstance(raw, dict) and 'properties' in raw and isinstance(raw['properties'], list):
        items = raw['properties']
    elif isinstance(raw, dict) and 'features' in raw and isinstance(raw['features'], dict):
        items = [raw['features']]
    else:
        # try if entire stdin is a single feature dict
        if isinstance(raw, dict):
            items = [raw]
        else:
            print(json.dumps({"success": False, "error": "Invalid input JSON. Expect {features: {...}} or {properties: [...]}."}))
            return sys.exit(6)

    if len(items) == 0:
        print(json.dumps({"success": False, "error": "No items to predict."}))
        return sys.exit(7)

    try:
        df = pd.DataFrame(items)
        # Preprocess and encode features
        df_processed = preprocess_features(df, encoders)
        
        # Basic cleaning: fill NaNs with zeros where numeric
        for c in df_processed.columns:
            if df_processed[c].dtype == object:
                continue
            df_processed[c] = df_processed[c].fillna(0)
        
        X = df_processed.values

        preds = model.predict(X)
        # ensure list
        preds_list = [float(p) for p in preds]

        out = {"success": True, "predictions": preds_list}
        # optional: if model supports predict_proba or similar include it
        print(json.dumps(out))
        return sys.exit(0)

    except Exception as e:
        print(json.dumps({"success": False, "error": str(e), "trace": traceback.format_exc()}))
        return sys.exit(8)


if __name__ == '__main__':
    main()
