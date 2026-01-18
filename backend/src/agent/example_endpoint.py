"""
Example FastAPI endpoint implementation using the data bridge.
This shows how to integrate the data bridge with your backend API.
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
import json

from data_bridge import DataBridge, create_http_handler

app = FastAPI()

# Initialize data bridge (singleton pattern)
bridge = DataBridge()

# Create HTTP handler
handle_post = create_http_handler(bridge)


class FeatureData(BaseModel):
    """Pydantic model for feature data validation."""
    blink_rate: float = 0
    ear_mean: float = 0.28
    jaw_tension: float = 0
    breathing_rate: float = 0
    breathing_amplitude: str = "medium"
    facial_variance: float = 0
    speaking: bool = False
    head_motion: str = "low"
    timestamp: int = 0


@app.post("/api/features")
async def receive_features(features: FeatureData):
    """
    Receive features from frontend and return processed physiological data.
    
    Request body:
    {
        "blink_rate": 18,
        "ear_mean": 0.28,
        "jaw_tension": 0.71,
        "breathing_rate": 22,
        "breathing_amplitude": "low",
        "facial_variance": 0.12,
        "speaking": true,
        "head_motion": "low",
        "timestamp": 1710000000
    }
    
    Response:
    {
        "status": "success",
        "processed_data": {
            "arousal_level": "medium",
            "cognitive_load": "high",
            "regulation_state": "strained",
            "confidence": 0.85,
            "breathing_pattern": "shallow",
            "stress_indicators": ["blink suppression", "jaw tension"],
            ...
        },
        "timestamp": 1710000000
    }
    """
    try:
        # Convert Pydantic model to dict
        features_dict = features.dict()
        
        # Process through data bridge
        result = handle_post(features_dict)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/features/processed")
async def get_processed_features():
    """
    Get the latest processed physiological data as JSON string.
    
    Returns:
        JSON string of processed physiological features
    """
    try:
        json_data = bridge.get_features_json()
        return {
            "status": "success",
            "data": json.loads(json_data)  # Parse and return as dict
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/features/processed/json")
async def get_processed_features_json():
    """
    Get the latest processed physiological data as raw JSON string.
    Useful when you need the JSON string directly.
    
    Returns:
        Plain JSON string
    """
    try:
        json_data = bridge.get_features_json()
        from fastapi.responses import Response
        return Response(
            content=json_data,
            media_type="application/json"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
