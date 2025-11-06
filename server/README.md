Using the Python ML predictor

This project supports using a Python pickled ML model for price predictions. Place your model files next to this README (in the `server/` folder):

- `model.pkl`          <- trained sklearn model (or compatible) saved with joblib
- `encoder.pkl`        <- optional preprocessor (ColumnTransformer, OneHotEncoder, etc.)

The Node.js price prediction route (`/api/price-prediction/predict` and `/api/price-prediction/compare`) will try to run `ml_predictor.py` using the `python` executable (or the path specified in the `PYTHON` env var). If the script or model isn't available, it falls back to the built-in JS heuristic.

Python dependencies (install into a virtualenv):

```
# from server/ folder
pip install pandas numpy scikit-learn joblib
```

Quick test (from project root):

```
# single prediction
echo '{"features": {"area": 1200, "bedrooms": 3, "bathrooms": 2, "floors": 1, "yearBuilt": 2015}}' | python server/ml_predictor.py

# batch prediction
echo '{"properties": [{"area": 1200, "bedrooms": 3, "bathrooms": 2, "floors": 1, "yearBuilt": 2015},{"area": 800, "bedrooms": 2, "bathrooms": 1, "floors": 1, "yearBuilt": 2005}]}' | python server/ml_predictor.py
```

If you want the Python predictor to be used automatically by the server in Windows, ensure `python` is on PATH or set the `PYTHON` environment variable to the full path of your Python executable before starting the Node server.
