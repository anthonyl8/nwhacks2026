"""
Example usage of the Personal Wellness AI Agent.
Demonstrates how to update physiology data and interact with the agent.
"""
import sys
import os
import json
import time

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(__file__))

from server import update_physiology_data


def example_1_calm_state():
    """Example: User in a calm, regulated state"""
    print("=" * 60)
    print("Example 1: Calm State")
    print("=" * 60)
    
    # Update physiology data to reflect calm state
    update_physiology_data({
        "arousal_level": "low",
        "cognitive_load": "low",
        "regulation_state": "regulated",
        "confidence": 0.9
    })
    
    print("\nPhysiology data updated:")
    print(json.dumps({
        "arousal_level": "low",
        "cognitive_load": "low",
        "regulation_state": "regulated",
        "confidence": 0.9
    }, indent=2))
    
    print("\nUser: 'I've been feeling pretty good lately, just checking in.'")
    print("\nAgent would respond naturally, likely without calling get_physiology_snapshot")
    print("since the user is clearly expressing themselves and seems fine.")


def example_2_stress_state():
    """Example: User expressing stress"""
    print("\n" + "=" * 60)
    print("Example 2: Stress State")
    print("=" * 60)
    
    # Update physiology data to reflect stress
    update_physiology_data({
        "arousal_level": "high",
        "cognitive_load": "high",
        "regulation_state": "strained",
        "confidence": 0.85
    })
    
    print("\nPhysiology data updated:")
    print(json.dumps({
        "arousal_level": "high",
        "cognitive_load": "high",
        "regulation_state": "strained",
        "confidence": 0.85
    }, indent=2))
    
    print("\nUser: 'I'm feeling really overwhelmed and I don't know why.'")
    print("\nAgent would likely call get_physiology_snapshot because:")
    print("- User expresses vague emotional state ('don't know why')")
    print("- Mentions overwhelm (stress/anxiety)")
    print("- Physiological context could help guide response")
    print("\nAgent might respond with:")
    print("'I hear that you're feeling overwhelmed. That can be really difficult.'")
    print("'I might be wrong, but it seems like your body could be holding some tension.'")
    print("'Would it help to take a moment and breathe together?'")


def example_3_dysregulation():
    """Example: User in dysregulated state"""
    print("\n" + "=" * 60)
    print("Example 3: Dysregulation")
    print("=" * 60)
    
    # Update physiology data to reflect dysregulation
    update_physiology_data({
        "arousal_level": "high",
        "cognitive_load": "medium",
        "regulation_state": "dysregulated",
        "confidence": 0.75
    })
    
    print("\nPhysiology data updated:")
    print(json.dumps({
        "arousal_level": "high",
        "cognitive_load": "medium",
        "regulation_state": "dysregulated",
        "confidence": 0.75
    }, indent=2))
    
    print("\nUser: 'I just feel... off. Something's not right.'")
    print("\nAgent would call get_physiology_snapshot because:")
    print("- User expresses vague emotional state")
    print("- Physiological context would help understand what 'off' means")
    print("\nAgent would detect:")
    print("- Irregular breathing pattern")
    print("- Stress indicators: elevated arousal, regulation challenges")
    print("\nAgent might respond with:")
    print("'Sometimes it's hard to put words to what we're feeling.'")
    print("'I might be wrong, but it seems like your body could be holding some tension.'")
    print("'Would you like to try a brief breathing exercise together?'")


def example_4_no_data():
    """Example: No physiological data available"""
    print("\n" + "=" * 60)
    print("Example 4: No Data Available")
    print("=" * 60)
    
    # Clear physiology data
    update_physiology_data(None)
    
    print("\nPhysiology data: None (sensing disabled or unavailable)")
    
    print("\nUser: 'I'm feeling anxious about my presentation tomorrow.'")
    print("\nAgent would NOT call get_physiology_snapshot because:")
    print("- Data is unavailable")
    print("- User is clearly expressing themselves")
    print("\nAgent would respond conversationally:")
    print("'Presentations can bring up a lot of feelings. What's making you feel anxious about it?'")


def run_examples():
    """Run all examples"""
    print("\n" + "=" * 60)
    print("Personal Wellness AI Agent - Usage Examples")
    print("=" * 60)
    
    example_1_calm_state()
    time.sleep(1)
    
    example_2_stress_state()
    time.sleep(1)
    
    example_3_dysregulation()
    time.sleep(1)
    
    example_4_no_data()
    
    print("\n" + "=" * 60)
    print("To actually interact with the agent, run:")
    print("  python wellness_agent.py")
    print("=" * 60)


if __name__ == "__main__":
    run_examples()
