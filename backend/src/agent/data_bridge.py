"""
Data Bridge for Physiological Feature Data
Handles receiving features from frontend and providing processed physiological data.
"""
import json
import time
from typing import Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class DataBridge:
    """
    Bridge between frontend feature extraction and backend processing.
    Stores raw features and provides processed physiological insights.
    """
    
    def __init__(self):
        self.raw_features_history: list = []
        self.processed_physiology_data: Optional[Dict[str, Any]] = None
        self.last_update_time: Optional[float] = None
        self.max_history_size = 1000  # Keep last 1000 feature updates
        
    def receive_features(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Receive raw features from frontend and process them.
        
        Args:
            features: Raw feature data from frontend MediaPipe extraction
            
        Returns:
            Dictionary with processed physiological data
        """
        try:
            # Add timestamp if not present
            if "timestamp" not in features:
                features["timestamp"] = int(time.time())
            
            # Store in history
            self.raw_features_history.append({
                **features,
                "received_at": time.time()
            })
            
            # Maintain history size
            if len(self.raw_features_history) > self.max_history_size:
                self.raw_features_history.pop(0)
            
            # Process features into physiological insights
            processed = self._process_features(features)
            
            # Update stored processed data
            self.processed_physiology_data = processed
            self.last_update_time = time.time()
            
            # Update server.py physiology data
            self._update_server_physiology_data(processed)
            
            logger.info(f"Received and processed features at {datetime.fromtimestamp(time.time())}")
            
            return {
                "status": "success",
                "processed_data": processed,
                "timestamp": features.get("timestamp")
            }
            
        except Exception as e:
            logger.error(f"Error processing features: {e}", exc_info=True)
            return {
                "status": "error",
                "message": str(e)
            }
    
    def _process_features(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process raw features into interpreted physiological signals.
        
        This converts MediaPipe features into higher-level physiological insights.
        """
        # Extract key features
        blink_rate = features.get("blink_rate", 0)
        ear_mean = features.get("ear_mean", 0.28)
        jaw_tension = features.get("jaw_tension", 0)
        breathing_rate = features.get("breathing_rate", 0)
        breathing_amplitude = features.get("breathing_amplitude", "medium")
        facial_variance = features.get("facial_variance", 0)
        speaking = features.get("speaking", False)
        head_motion = features.get("head_motion", "low")
        
        # Process into physiological insights
        processed = {
            # Arousal level (based on multiple signals)
            "arousal_level": self._infer_arousal_level(
                blink_rate, jaw_tension, head_motion, breathing_rate
            ),
            
            # Cognitive load (based on facial variance, blink suppression)
            "cognitive_load": self._infer_cognitive_load(
                facial_variance, blink_rate, head_motion
            ),
            
            # Regulation state (overall physiological regulation)
            "regulation_state": self._infer_regulation_state(
                blink_rate, jaw_tension, breathing_rate, 
                breathing_amplitude, facial_variance
            ),
            
            # Confidence (based on data quality and consistency)
            "confidence": self._calculate_confidence(features),
            
            # Breathing pattern
            "breathing_pattern": self._infer_breathing_pattern(
                breathing_rate, breathing_amplitude
            ),
            
            # Stress indicators
            "stress_indicators": self._identify_stress_indicators(
                blink_rate, jaw_tension, breathing_rate, 
                breathing_amplitude, facial_variance
            ),
            
            # Raw feature summary (for reference)
            "raw_features": {
                "blink_rate": blink_rate,
                "ear_mean": ear_mean,
                "jaw_tension": jaw_tension,
                "breathing_rate": breathing_rate,
                "breathing_amplitude": breathing_amplitude,
                "facial_variance": facial_variance,
                "speaking": speaking,
                "head_motion": head_motion
            },
            
            # Temporal context (if available from history)
            "temporal_context": self._get_temporal_context()
        }
        
        return processed
    
    def _infer_arousal_level(self, blink_rate: float, jaw_tension: float, 
                           head_motion: str, breathing_rate: float) -> str:
        """Infer arousal level from features."""
        signals = 0
        
        # Blink suppression (low blink rate = high arousal)
        if blink_rate < 10:
            signals += 2
        elif blink_rate < 15:
            signals += 1
        
        # Jaw tension
        if jaw_tension > 0.7:
            signals += 2
        elif jaw_tension > 0.5:
            signals += 1
        
        # Head motion
        if head_motion == "high":
            signals += 1
        
        # Breathing rate
        if breathing_rate > 25:
            signals += 1
        elif breathing_rate < 12:
            signals += 1
        
        if signals >= 4:
            return "high"
        elif signals >= 2:
            return "medium"
        else:
            return "low"
    
    def _infer_cognitive_load(self, facial_variance: float, 
                             blink_rate: float, head_motion: str) -> str:
        """Infer cognitive load from features."""
        signals = 0
        
        # Low facial variance = rigidity = high load
        if facial_variance < 0.02:
            signals += 2
        elif facial_variance < 0.05:
            signals += 1
        
        # Blink suppression
        if blink_rate < 10:
            signals += 1
        
        # Low head motion = stillness = high load
        if head_motion == "low":
            signals += 1
        
        if signals >= 3:
            return "high"
        elif signals >= 1:
            return "medium"
        else:
            return "low"
    
    def _infer_regulation_state(self, blink_rate: float, jaw_tension: float,
                               breathing_rate: float, breathing_amplitude: str,
                               facial_variance: float) -> str:
        """Infer regulation state from features."""
        dysregulation_signals = 0
        
        # Irregular breathing
        if breathing_amplitude == "low" or breathing_rate < 10 or breathing_rate > 30:
            dysregulation_signals += 1
        
        # High jaw tension
        if jaw_tension > 0.7:
            dysregulation_signals += 1
        
        # Facial rigidity
        if facial_variance < 0.02:
            dysregulation_signals += 1
        
        # Very low blink rate
        if blink_rate < 8:
            dysregulation_signals += 1
        
        if dysregulation_signals >= 3:
            return "dysregulated"
        elif dysregulation_signals >= 1:
            return "strained"
        else:
            return "regulated"
    
    def _calculate_confidence(self, features: Dict[str, Any]) -> float:
        """Calculate confidence in the processed data."""
        confidence = 1.0
        
        # Check for missing or invalid values
        required_fields = ["blink_rate", "ear_mean", "jaw_tension", 
                          "breathing_rate", "facial_variance"]
        missing = sum(1 for field in required_fields if field not in features)
        confidence -= missing * 0.1
        
        # Check for extreme values (might indicate sensor issues)
        if features.get("ear_mean", 0.28) < 0.1 or features.get("ear_mean", 0.28) > 0.5:
            confidence -= 0.2
        
        # Check timestamp freshness (if provided)
        if "timestamp" in features:
            age = time.time() - features["timestamp"]
            if age > 5:  # More than 5 seconds old
                confidence -= 0.2
        
        return max(0.0, min(1.0, confidence))
    
    def _infer_breathing_pattern(self, breathing_rate: float, 
                                breathing_amplitude: str) -> str:
        """Infer breathing pattern."""
        if breathing_amplitude == "low":
            return "shallow"
        elif breathing_rate < 10 or breathing_rate > 30:
            return "irregular"
        else:
            return "regular"
    
    def _identify_stress_indicators(self, blink_rate: float, jaw_tension: float,
                                   breathing_rate: float, breathing_amplitude: str,
                                   facial_variance: float) -> list:
        """Identify stress indicators from features."""
        indicators = []
        
        if blink_rate < 10:
            indicators.append("blink suppression")
        if jaw_tension > 0.7:
            indicators.append("jaw tension")
        if breathing_amplitude == "low":
            indicators.append("shallow breathing")
        if breathing_rate > 25:
            indicators.append("elevated breathing rate")
        if facial_variance < 0.02:
            indicators.append("facial rigidity")
        
        return indicators
    
    def _get_temporal_context(self) -> Dict[str, Any]:
        """Get temporal context from recent history."""
        if len(self.raw_features_history) < 2:
            return {"trend": "insufficient_data"}
        
        recent = self.raw_features_history[-10:]  # Last 10 updates
        
        # Calculate trends
        blink_rates = [f.get("blink_rate", 0) for f in recent if "blink_rate" in f]
        jaw_tensions = [f.get("jaw_tension", 0) for f in recent if "jaw_tension" in f]
        
        if len(blink_rates) >= 2:
            blink_trend = "increasing" if blink_rates[-1] > blink_rates[0] else "decreasing"
        else:
            blink_trend = "stable"
        
        if len(jaw_tensions) >= 2:
            tension_trend = "increasing" if jaw_tensions[-1] > jaw_tensions[0] else "decreasing"
        else:
            tension_trend = "stable"
        
        return {
            "trend": "analyzed",
            "blink_rate_trend": blink_trend,
            "jaw_tension_trend": tension_trend,
            "samples_analyzed": len(recent)
        }
    
    def _update_server_physiology_data(self, processed: Dict[str, Any]):
        """Update the server.py physiology data."""
        try:
            from server import update_physiology_data
            # Extract the key fields for server.py
            server_data = {
                "arousal_level": processed.get("arousal_level", "unknown"),
                "cognitive_load": processed.get("cognitive_load", "unknown"),
                "regulation_state": processed.get("regulation_state", "unknown"),
                "confidence": processed.get("confidence", 0.0)
            }
            update_physiology_data(server_data)
        except ImportError:
            # server.py might not be importable in this context
            pass
        except Exception as e:
            logger.warning(f"Could not update server physiology data: {e}")
    
    def get_processed_data(self) -> Optional[Dict[str, Any]]:
        """Get the latest processed physiological data."""
        return self.processed_physiology_data
    
    def get_features_json(self) -> str:
        """
        Get processed physiological data as JSON string.
        
        Returns:
            JSON string of processed physiological features
        """
        if self.processed_physiology_data is None:
            return json.dumps({
                "status": "no_data",
                "message": "No physiological data available"
            })
        
        return json.dumps(self.processed_physiology_data, indent=2)


def create_http_handler(bridge: DataBridge):
    """
    Create an HTTP handler function for FastAPI endpoint.
    
    Usage:
        @app.post("/api/features")
        async def receive_features(features: dict):
            from backend.agent.data_bridge import DataBridge, create_http_handler
            bridge = DataBridge()
            handle_post = create_http_handler(bridge)
            return handle_post(features)
    """
    def handle_post(features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle POST request with features.
        
        Args:
            features: Feature data from request body
            
        Returns:
            Response with processed data
        """
        result = bridge.receive_features(features)
        return result
    
    return handle_post
