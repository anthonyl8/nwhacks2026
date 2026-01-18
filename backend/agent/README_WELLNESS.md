# Personal Wellness AI Agent

A conversational AI agent designed to support users through emotionally intelligent dialogue, optionally informed by real-time physiological context.

## Overview

The Personal Wellness AI Agent:
- Maintains natural, warm, human-like dialogue
- Adapts conversational style based on inferred physiological state
- Never diagnoses, judges, or presents biometric data as medical fact
- Provides text-based responses (voice/audio handled by frontend)

## Architecture

The agent uses:
- **Strands SDK** for agent orchestration
- **MCP (Model Context Protocol)** for tool access
- **OpenAI GPT-4o-mini** as the language model

### Components

1. **wellness_agent.py** - Main agent implementation
2. **server.py** - MCP server providing `get_physiology_snapshot` tool

## Tool: get_physiology_snapshot

The agent has access to a tool that returns interpreted physiological signals:

```python
{
    "arousal_level": "low" | "medium" | "high",
    "cognitive_load": "low" | "medium" | "high",
    "regulation_state": "regulated" | "strained" | "dysregulated",
    "confidence": 0.0-1.0,
    "signal_quality": "good" | "fair" | "poor",
    "breathing_pattern": "regular" | "shallow" | "irregular",
    "stress_indicators": ["elevated arousal", "high cognitive load", ...]
}
```

### When the Agent Uses This Tool

The agent requests biometric context ONLY when:
- User expresses vague or confusing emotional states
- Conversation involves stress, anxiety, overwhelm, fatigue, or grounding
- Physiological context would improve support
- Need to decide whether to slow down, pause, or guide breathing

The agent does NOT request it:
- Repeatedly within short time spans
- When signal quality is likely low
- When user is clearly focused and verbally expressive
- If user has paused or disabled sensing

## Running the Agent

### Interactive Mode

```bash
cd backend/agent
python wellness_agent.py
```

The agent will start a conversational loop, reading from stdin.

### Single Message Mode

```bash
python wellness_agent.py "I'm feeling really overwhelmed today"
```

### Integration with Frontend

The agent can be integrated with the frontend to receive:
1. User messages (text)
2. Physiological data from the regulation agent

Note: Voice/audio input/output is handled by the frontend, not the backend agent.

## Conversation Examples

### Example 1: User expresses stress

**User:** "I'm feeling really overwhelmed today"

**Agent (may call get_physiology_snapshot):** "I hear that you're feeling overwhelmed. That can be really difficult. Would it help to take a moment and breathe together?"

### Example 2: User is calm and engaged

**User:** "I've been working on this project and I'm excited about the progress"

**Agent (no tool call needed):** "That sounds wonderful. What's been the most rewarding part of the work?"

### Example 3: User expresses vague emotional state

**User:** "I don't know, I just feel... off"

**Agent (calls get_physiology_snapshot):** "Sometimes it's hard to put words to what we're feeling. I might be wrong, but it seems like your body could be holding some tension. Would you like to explore that together?"

## Safety & Ethics

The agent:
- ✅ Never diagnoses conditions
- ✅ Never claims medical certainty
- ✅ Never pressures users to continue sensing
- ✅ Respects explicit user preferences
- ✅ Encourages external help when needed
- ✅ Uses uncertainty-aware language

## Response Format

All responses are text-based and designed to be:
- Natural and conversational
- Short and clear
- Warm and supportive
- Ready for frontend voice synthesis (if implemented)

## Environment Variables

Required:
- `OPENAI_API_KEY` - OpenAI API key for the language model

## Integration with Regulation Agent

The wellness agent can receive physiological data from:
1. The regulation agent (if implemented)
2. Direct updates to `server.py` via `update_physiology_data()`
3. Frontend WebSocket connections

## Development

To test the agent with mock physiological data:

```python
from server import update_physiology_data

update_physiology_data({
    "arousal_level": "high",
    "cognitive_load": "medium",
    "regulation_state": "strained",
    "confidence": 0.85
})
```

Then run the agent and it will have access to this data via the tool.
