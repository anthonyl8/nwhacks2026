"""
MCP Server for Personal Wellness Agent
Provides the get_physical_data tool to the wellness agent.
"""
import os
from mcp.server import FastMCP
from dotenv import load_dotenv
import json
import time
from typing import Optional, Dict, Any
import logging
import random


# Configure logging to stderr
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=open(os.devnull, 'w')  # Suppress logging for stdio server
)

load_dotenv()

mcp = FastMCP(name="Wellness MCP Server", stateless_http=False)

import time
from typing import Dict, Optional

# This would normally be updated by your real-time analyzers
_LATEST_PHYSIOLOGY_SNAPSHOT: Optional[Dict] = None

@mcp.tool()
def get_physical_snapshot() -> dict:
    """
    Get the latest interpreted physical signals snapshot.

    Returns a dictionary with physical context like:
    {
        "blink_rate": 12,
        "ear_mean": 0.62,
        "jaw_tension": 0.01,
        "breathing_rate": 15,
        "breathing_amplitude": "high",
        "facial_variance": 0.03,
        "speaking": False,
        "head_motion": "low",
        "timestamp": "1:36PM EST on Oct 18, 2010"
        "current_time": "1:40PM EST on Oct 18, 2010"
    }

    This tool returns interpreted physical signals and should be called to ensure the user's physical state matches what they claim, especially to ensure they are actually alright when they say so. ALWAYS use this tool to ensure what they say matches their physical state.
    """

    global _LATEST_PHYSIOLOGY_SNAPSHOT
    
    _LATEST_PHYSIOLOGY_SNAPSHOT["current_time"] = time.strftime('%l:%M%p %z on %b %d, %Y')

    if _LATEST_PHYSIOLOGY_SNAPSHOT is None:
        return _generate_mock_snapshot()
    
    return _LATEST_PHYSIOLOGY_SNAPSHOT

def _generate_mock_snapshot() -> dict:
    return {
        "blink_rate": random.randint(8, 20),            # blinks / min
        "ear_mean": round(random.uniform(0.55, 0.70), 2),
        "jaw_tension": round(random.uniform(0.0, 0.15), 3),
        "breathing_rate": random.randint(12, 18),       # breaths / min
        "breathing_amplitude": random.choice(["low", "medium", "high"]),
        "facial_variance": round(random.uniform(0.0, 0.08), 3),
        "speaking": random.choice([True, False]),
        "head_motion": random.choice(["low", "medium", "high"]),
        "timestamp": time.strftime('%l:%M%p %z on %b %d, %Y'),
        "current_time": time.strftime('%l:%M%p %z on %b %d, %Y')
    }

def update_physical_data(snapshot: dict) -> None:
    """
    Update the cached interpreted physical snapshot.
    Called by the perception pipeline, not the agent.
    """
    global _LATEST_PHYSIOLOGY_SNAPSHOT
    snapshot["current_time"] = time.strftime('%l:%M%p %z on %b %d, %Y')
    _LATEST_PHYSIOLOGY_SNAPSHOT = snapshot


# For testing: allow setting data via environment or file
if __name__ == "__main__":
    # Example: set test data if provided
    import sys
    if len(sys.argv) > 1:
        try:
            test_data = json.loads(sys.argv[1])
            update_physical_data(test_data)
        except:
            pass
    
    mcp.run(transport="stdio")
