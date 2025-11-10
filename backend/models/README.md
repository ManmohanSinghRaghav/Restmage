# ML Models Directory

This directory contains trained machine learning models for price prediction.

## Required Files

- `model.pkl` - Trained scikit-learn model for price prediction
- `encoder.pkl` - Label encoders for categorical features

## Model Training

To train and save the model:

```python
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder

# Train your model
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Save model
joblib.dump(model, 'model.pkl')

# Save encoder
encoder = LabelEncoder()
# ... fit encoder on categorical columns
joblib.dump(encoder, 'encoder.pkl')
```

## Fallback Behavior

If model files are not present, the system will automatically fall back to the heuristic pricing model. This ensures the API continues to function even without trained ML models.

## Model Requirements

- **Format**: scikit-learn model saved with joblib
- **Input Features**: 
  - Area (numeric)
  - Bedrooms (numeric)
  - Bathrooms (numeric)
  - Floors (numeric)
  - Location (categorical: Urban, Suburban, Rural)
  - Condition (categorical: Excellent, Good, Fair, Poor)
  - Garage (categorical: Yes, No)
- **Output**: Predicted price in INR

## Updating Models

1. Train new model with updated data
2. Save as `model.pkl` and `encoder.pkl`
3. Place in this directory
4. Restart the backend server

The ML service will automatically load the new models on startup.
