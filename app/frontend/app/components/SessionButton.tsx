import { CommitStrategy, useScribe } from "@elevenlabs/react";
import { supabase } from "~/lib/supabase";
import { b64 } from "~/lib/b64";

const ScribeTokenUrl = "http://localhost:8000/scribe";

interface SpeakRequest {
  user_text: string;
  history?: Array<Record<string, string>> | null;
  b64_frame: string;
}
export default function MyComponent() {
  async function fetchTokenFromServer(): Promise<string> {
    const res = await fetch(ScribeTokenUrl, { method: "GET" });

    if (!res.ok) {
      throw new Error(`Token request failed: ${res.status} ${res.statusText}`);
    }

    const body = await res.json();

    if (!body || typeof body !== "object") {
      throw new Error("Invalid token response");
    }

    // Accept either { token: '...' } or { data: { token: '...' } }
    const token = (body as any).token ?? (body as any).data?.token;

    if (!token || typeof token !== "string") {
      throw new Error("Token missing from server response");
    }

    return token;
  }

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    languageCode: "en",
    commitStrategy: CommitStrategy.VAD,
    onPartialTranscript: (data) => {
      console.log("Partial:", data.text);
    },
    onCommittedTranscript: (data) => {
      console.log("Committed:", data.text);
      const reqBody: SpeakRequest = {
        user_text: data.text,
        history: null,
        b64_frame: b64,
      };

      fetch("http://localhost:8000/intelligence/speak", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Indicate the data type in the body
        },
        body: JSON.stringify(reqBody),
      });
    },
    onCommittedTranscriptWithTimestamps: (data) => {
      console.log("Committed with timestamps:", data.text);
      console.log("Timestamps:", data.words);
    },
  });

  const handleStart = async () => {
    // attempt to read current supabase user id; fall back to empty string
    let userId = "";
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      userId = sessionData?.session?.user?.id ?? "";
    } catch (err) {
      console.warn("Could not get supabase user id:", err);
    }
    // Fetch a single use token from the server
    fetch(`http://localhost:8000/intelligence/start?auth_id=${userId}`, {
      method: "POST",
    });
    const token = await fetchTokenFromServer();

    await scribe.connect({
      token,
      microphone: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
  };

  return (
    <div>
      <button onClick={handleStart} disabled={scribe.isConnected}>
        Start Recording
      </button>
      <button onClick={scribe.disconnect} disabled={!scribe.isConnected}>
        Stop
      </button>

      {scribe.partialTranscript && <p>Live: {scribe.partialTranscript}</p>}

      <div>
        {scribe.committedTranscripts.map((t) => (
          <p key={t.id}>{t.text}</p>
        ))}
      </div>
    </div>
  );
}
