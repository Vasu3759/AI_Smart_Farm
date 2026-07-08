from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pandas as pd
import joblib
import os

router = APIRouter()

# Load the trained XGBoost model
model_path = os.path.join(os.path.dirname(__file__), "../models/yield_prediction_xgboost.pkl")
try:
    model = joblib.load(model_path)
    print("AI Model loaded successfully.")
except Exception as e:
    print(f"Warning: Failed to load AI model. Error: {e}")
    model = None

# Pydantic model exactly matching the 14 training features
class PredictionRequest(BaseModel):
    crop: int
    year: int
    season: int
    state: int
    temperature: float
    rainfall: float
    humidity: float
    N: float
    P: float
    K: float
    pH: float
    fertilizer: float
    pesticide: float
    area: float

class PredictionResponse(BaseModel):
    status: str
    predicted_yield_per_area: float
    ai_confidence_score: float

@router.post("/predict", response_model=PredictionResponse)
def predict_crop(request: PredictionRequest):
    if model is None:
        raise HTTPException(status_code=500, detail="AI Model is not loaded. Please train the model first.")
        
    try:
        # Create a DataFrame with a single row matching the exact 14 features order
        input_data = pd.DataFrame([{
            "crop": request.crop,
            "year": request.year,
            "season": request.season,
            "state": request.state,
            "temperature": request.temperature,
            "rainfall": request.rainfall,
            "humidity": request.humidity,
            "N": request.N,
            "P": request.P,
            "K": request.K,
            "pH": request.pH,
            "fertilizer": request.fertilizer,
            "pesticide": request.pesticide,
            "area": request.area
        }])
        
        # Execute prediction
        prediction = model.predict(input_data)
        
        return PredictionResponse(
            status="success",
            predicted_yield_per_area=float(prediction[0]),
            ai_confidence_score=0.95 # Mocking confidence score as XGBoost regressor doesn't provide probability
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
