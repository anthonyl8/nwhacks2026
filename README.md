# HealthSimple

## Inspiration

Most AI assistants understand *language*, but they miss something fundamental about human communication: **emotion**. In real conversations, how someone feels often matters more than what they say.

We were inspired by the gap between emotionally rich human interaction and the flat, text-only nature of most AI systems. Wellness conversations in particular suffer from this — when someone is stressed, overwhelmed, or disengaged, the *way* an AI responds can make a meaningful difference.

HealthSimple started as an exploration of a simple question:  
**What if AI could adapt to how you feel in the moment, not just the words you type?**

---

## What it does

HealthSimple is a personal wellness AI that responds with emotional awareness in real time.

Each time a user sends a message, the app captures a single camera frame and analyzes it using a vision-capable LLM to infer high-level emotional context such as stress, calm, or engagement. 

That context is sent alongside the user’s message to the conversational agent, which adapts its tone, pacing, and conversational style accordingly.  
For example:
- If the user appears stressed, responses slow down and focus on grounding
- If the user seems disengaged, the agent gently invites reflection
- If the user appears calm, the conversation can go deeper

HealthSimple does **not** diagnose, label, or store emotional data, and it does not perform identity recognition. The goal is not to analyze users, but to respond to them more thoughtfully.

---

## How we built it

HealthSimple uses a decoupled, multimodal architecture:

- **Frontend (Web)**
  - Live camera capture
  - Single-frame snapshot taken at each user message
  - Privacy-first: no video storage or streaming
- **Backend**
  - Vision-based sentiment inference using an LLM
  - Emotion output represented as soft, uncertainty-aware labels
  - No persistent biometric or emotional state tracking
- **Conversational Agent**
  - Built using a modular agent framework
  - Receives user text + inferred emotional context
  - Uses that context only to guide *how* it responds, not *what conclusions* it makes
  - Designed with strict safety constraints: no diagnosis, no authority, no dependency

This separation allowed us to iterate quickly while keeping emotional inference, reasoning, and conversation cleanly isolated.

---

## Challenges we ran into

One of the biggest challenges was deciding **who should control when emotional context is gathered**.

Our initial design gave the backend agent autonomy to decide when it wanted to analyze the user’s emotional state by exposing fetch tools to the agent via a STDIO transport MCP server — for example, triggering emotion analysis when it inferred stress from conversation alone. In practice, this approach introduced several problems.

First, it created a **circular reasoning loop**: the agent would infer stress from text, request emotional context to confirm it, and then reinforce its own assumptions. This made the system overconfident in ambiguous situations.

Second, it raised **transparency and consent concerns**. From a user perspective, it was unclear *when* or *why* emotional analysis was happening, which conflicted with our goal of building a calm, trust-preserving experience.

Third, it complicated system behavior and debugging. Emotion requests became dependent on subtle conversational cues, making responses less predictable and harder to reason about or evaluate.

We ultimately pivoted to a simpler and more robust approach: emotional context is captured **once per user turn**, explicitly tied to the moment the user chooses to speak. This removed hidden triggers, eliminated feedback loops, reduced complexity, and aligned better with privacy and ethical design principles.

---

## Accomplishments that we're proud of

- Built a working multimodal AI experience end-to-end
- Successfully integrated visual emotion context without storing video or personal data
- Designed an agent that adapts *style* rather than making emotional claims
- Created a calm, human-centered interaction rather than a flashy demo
- Maintained ethical boundaries while still exploring emotional intelligence

---

## What we learned

We learned that small adjustments in tone, pacing, and phrasing can significantly change how supportive an interaction feels. Being more careful is key in AI emotional awareness. We also learned that multimodal AI becomes far more powerful when uncertainty and humility are treated as first-class design principles.

Most importantly, we learned that building human-centered AI requires as much attention to *what not to do* as what to build.

---

## What's next for HealthSimple

Next, we want to:
- Improve emotional inference robustness across lighting and environments
- Allow users to opt into or out of emotion-aware responses dynamically
- Explore session-level reflections that help users feel seen without storing sensitive data
- Expand beyond wellness into education, coaching, and accessibility use cases

Our long-term vision is to make emotionally aware AI interactions feel simple, respectful, and genuinely human, just like the name HealthSimple suggests.
