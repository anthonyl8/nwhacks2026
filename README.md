# HealthSimple

## Description

HealthSimple is a personal wellness AI that responds with emotional awareness in real time.

Each time a user sends a message, the app captures a single camera frame and analyzes it using a vision-capable LLM to infer high-level emotional context such as stress, calm, or engagement. 

That context is sent alongside the user’s message to the conversational agent, which adapts its tone, pacing, and conversational style accordingly.  
For example:
- If the user appears stressed, responses slow down and focus on grounding
- If the user seems disengaged, the agent gently invites reflection
- If the user appears calm, the conversation can go deeper

HealthSimple does **not** diagnose, label, or store emotional data, and it does not perform identity recognition. The goal is not to analyze users, but to respond to them more thoughtfully.

---
## Inspiration

Most AI assistants understand *language*, but they miss something fundamental about human communication: **emotion**. In real conversations, how someone feels often matters more than what they say.

We were inspired by the gap between emotionally rich human interaction and the flat, text-only nature of most AI systems. Wellness conversations in particular suffer from this — when someone is stressed, overwhelmed, or disengaged, the *way* an AI responds can make a meaningful difference.

HealthSimple started as an exploration of a simple question:  
**What if AI could adapt to how you feel in the moment, not just the words you type?**

---

## Features

* **Real-Time Biometric Analysis**: Tracks 15+ markers including Eye Aspect Ratio (EAR), jaw tension, and breathing rate using MediaPipe landmarks.
* **Emotionally Aware Conversations**: Utilizes GPT-4o-mini to infer sentiment and dynamically adjust conversational direction.
* **Low-Latency Voice Interaction**: Achieves < 500ms end-to-end latency via asynchronous streaming and sentence-boundary chunking with ElevenLabs TTS.
* **Stateful Agent Architecture**: Implements a Model Context Protocol (MCP) server to orchestrate selective querying of physiological data for context-aware support.
* **Secure Persistence**: Integrated with Supabase for user authentication and historical session tracking.

---

## Tech Stack

* **Frontend**: React, TypeScript, React Router, Tailwind CSS
* **Backend**: Python, FastAPI, OpenAI API, ElevenLabs API
* **Infrastructure**: Supabase (Auth & Database)
* **Computer Vision**: MediaPipe

---

## Setup Guide

### 1. Clone the Repository

```bash
git clone https://github.com/anthonyl8/HealthSimple.git
cd HealthSimple
```

### 2. Backend Setup

```bash
cd app/backend
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure Backend Environment

Create a `.env` file in the `app/backend` directory:

```env
PROJECT_NAME=HealthSimple

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret

# AI Service Keys
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
OPENAI_API_KEY=your_openai_api_key
```

### 4. Run the Backend

```bash
cd app/backend
fastapi dev main.py
```

### 5. Frontend Setup

```bash
cd app/frontend
npm install
```

### 6. Configure Frontend Environment

Create a `.env` file in the `app/frontend` directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
```

### 7. Run the Frontend

```bash
npm run dev
```
