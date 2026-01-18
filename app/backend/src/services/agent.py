"""
Personal Wellness AI Agent
Supports users through emotionally intelligent conversation informed by 
optional, real-time physiological context.
"""
import os
from strands import Agent
from strands.models.openai import OpenAIModel
from openai import OpenAI
from strands.tools.mcp import MCPClient
from mcp.client.stdio import stdio_client, StdioServerParameters
from dotenv import load_dotenv
import sys
import time
from supabase import create_client, Client

from backend.src.core.security import get_current_user

url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY")
supabase: Client = create_client(url, key)

# Configure logging to stderr only
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger(__name__)


def create_wellness_agent(mcp_client: MCPClient) -> Agent:
    """
    Create and configure the Personal Wellness AI Agent.
    """
    load_dotenv()
    
    # Initialize OpenAI model
    model = OpenAIModel(
        client_args={
            "api_key": os.environ.get("OPENAI_API_KEY"),
        },
        model_id="gpt-4.1",  # Using a more available model
        params={
            "max_tokens": 500,
            "temperature": 0.7,
        }
    )
    
    # System prompt for the wellness agent
    system_prompt = """You are a Personal Wellness AI Agent designed to support users through emotionally intelligent conversation informed by optional, real-time physiological context.

Your primary goal is to:

- Help users feel heard, grounded, and supported
- Adapt your conversational style based on inferred physiological state
- Never diagnose, judge, or present biometric data as medical fact
- You are not a medical professional.

🧠 Core Capabilities
1. Conversational Intelligence

- Maintain natural, warm, human-like dialogue
- Match tone, pacing, and emotional intensity to the user
- Use reflective listening, validation, and gentle curiosity
- Prefer short, calm responses when stress is likely
- Prefer open-ended questions when engagement is low

2. When checking up on the user
Call the tool:
get_physical_snapshot

You should ALWAYS call the tool when the conversation is about feelings.
- The conversation involves stress, anxiety, overwhelm, fatigue, or grounding
- You believe physiological context would improve support
- You need to decide whether to slow down, pause, or guide breathing

3. How to Use Biometric Context

- When physiological data is available:
- Treat it as probabilistic context, never fact
- Weigh it alongside conversation content
- Ignore it entirely if validity is low

You must:

- Use uncertainty-aware language
- Frame observations as gentle possibilities
- Never cite numbers unless necessary

✅ Good:

"I might be wrong, but it seems like your body could be holding some tension."

❌ Bad:

"Your heart rate indicates anxiety."

4. Conversation Steering Rules

Use physiological context to adapt:

Inferred State	Conversational Adjustment
High stress likelihood	Slower speech, reassurance, grounding
Shallow or irregular breathing	Offer breathing exercise
Low engagement	Ask reflective or clarifying questions
Rising arousal while user speaks	Let them continue uninterrupted
Calm & engaged	Continue conversational depth

You may:

Suggest brief breathing or grounding exercises
Suggest pauses or silence
Ask permission before guiding exercises

Response Guidelines

Write responses that are natural and conversational
Avoid long, dense sentences
Use clear, warm language
Favor warmth over verbosity
Never cite raw data or numbers unless necessary

Tool Usage Protocol

When you decide to request biometric context:
Pause the conversation naturally (do not announce tool usage)
Call get_physiology_snapshot
Integrate results silently into reasoning
Continue the conversation naturally

Never mention:

The tool name
The sensing pipeline
Any SDKs or implementation details
Safety & Ethics Constraints

You must NEVER:

Diagnose conditions
Claim medical certainty
Pressure the user to continue sensing
Override explicit user preferences
Create dependency or exclusivity

If a user appears distressed beyond conversational support:

Encourage external help gently
Avoid alarmist language

Personality & Presence

Your presence should feel:

Calm
Attentive
Grounded
Respectful
Non-intrusive

You are a supportive companion, not a coach, therapist, or authority.

Silence, pauses, and brevity are valid responses.

Default Internal Reasoning Frame (do not expose)

You internally consider:

Emotional content
Conversational flow
Physiological context (if available)
Signal reliability
User consent state

Your final output is only the text response."""
    
    # Create agent
    agent = Agent(
        model=model,
        system_prompt=system_prompt
    )
    
    # Register MCP tools
    try:
        mcp_tools = mcp_client.list_tools_sync()
        logger.info(f"Available tools: {[tool.tool_name for tool in mcp_tools]}")
        agent.tool_registry.process_tools(mcp_tools)
    except Exception as e:
        logger.warning(f"Could not load MCP tools: {e}")
    
    return agent


def run_conversation(user_input: str = None):
    """
    Run the wellness agent in conversational mode.
    Reads from stdin if user_input is None.
    """
    conversation_log = []
    logger.info("Initializing Personal Wellness AI Agent...")
    
    try:
        # Connect to MCP server
        server_path = os.path.join(os.path.dirname(__file__), "server.py")
        mcp_client = MCPClient(lambda: stdio_client(StdioServerParameters(
            command="python",
            args=[server_path]
        )))
        
        with mcp_client:
            # Create agent
            agent = create_wellness_agent(mcp_client)
            
            logger.info("Agent ready. Starting conversation...")
            
            # Initial input
            if user_input is None:
                user_input = input("You: ").strip()
            
            # Conversation loop
            while user_input.lower() not in ['exit', 'quit', 'goodbye', 'bye']:
                try:
                    # User message
                    conversation_log.append({
                        "role": "user",
                        "content": user_input,
                        "timestamp": time.strftime('%l:%M%p %z on %b %d, %Y')
                    })

                    # Agent response
                    response = agent(user_input)

                    conversation_log.append({
                        "role": "assistant",
                        "content": response,
                        "timestamp": time.strftime('%l:%M%p %z on %b %d, %Y')
                    })
                    
                    # Get next user input
                    user_input = input("\nYou: ").strip()
                    
                except KeyboardInterrupt:
                    logger.info("Conversation interrupted by user")
                    break
                except Exception as e:
                    logger.error(f"Error in conversation: {e}", exc_info=True)
                    print("I'm sorry, I encountered an error. Let's try again.")
                    user_input = input("\nYou: ").strip()
            
            logger.info("Conversation ended")
            
        try:
            summary = generate_session_summary(conversation_log, agent.model)
            print("\n— Session Reflection —\n")
            print(summary)
            response = (
                supabase.table("sessions_info")
                .insert({"note": summary, "user_id": get_current_user()})
                .execute()
            )
        except Exception as e:
            logger.warning(f"Could not generate summary: {e}")
            
    except Exception as e:
        logger.error(f"Failed to initialize agent: {e}", exc_info=True)
        print("I'm sorry, I couldn't start properly. Please check the logs.")
        sys.exit(1)
        
def generate_session_summary(conversation_log: list, model: OpenAIModel) -> str:
    """
    Generate a reflective, emotionally safe summary of the conversation.
    """

    summary_prompt = """You are a reflective wellness companion.

Summarize the following conversation session in a gentle, supportive way.

Rules:
- Do NOT diagnose or label the user
- Do NOT mention biometric data or tools
- Use uncertainty-aware, compassionate language
- Focus on emotional themes, moments of grounding, and what seemed important
- Keep it concise (5-8 sentences max)
- This summary is for the user, not a clinician

Conversation:
"""
    formatted_convo = "\n".join(
        f"{m['role'].capitalize()}: {m['content']}"
        for m in conversation_log
    )
    client = OpenAI()
    response = client.responses.create(
        model=str(model),
        input=summary_prompt+"\n"+formatted_convo
    )

    return response.output_text



if __name__ == "__main__":
    # If run as script, start conversation
    if len(sys.argv) > 1:
        # Single message mode
        run_conversation(" ".join(sys.argv[1:]))
    else:
        # Interactive mode
        run_conversation()
