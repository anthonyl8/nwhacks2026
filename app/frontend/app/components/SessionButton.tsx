import { CommitStrategy, useScribe } from "@elevenlabs/react";
import { useRef } from "react";
import { supabase } from "~/lib/supabase";
import { b64 } from "~/lib/b64";

const ScribeTokenUrl = "http://localhost:8000/scribe";

interface SpeakRequest {
  user_text: string;
  history?: Array<Record<string, string>> | null;
  b64_frame: string;
}
export default function MyComponent() {
  const scribeTokenRef = useRef<string | null>(null);
  const microphoneConfig = {
    echoCancellation: true,
    noiseSuppression: true,
  };

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
    onCommittedTranscript: async (data) => {
      console.log("Committed:", data.text);
      if (data.text.length > 5) {
        const reqBody: SpeakRequest = {
          user_text: data.text,
          history: null,
          b64_frame: b64,
        };

        try {
          if (scribe.isConnected) {
            await Promise.resolve(scribe.disconnect());
          }

          const response = await fetch(
            "http://localhost:8000/intelligence/speak",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json", // Indicate the data type in the body
              },
              body: JSON.stringify(reqBody),
            },
          );

          if (!response.ok) {
            throw new Error(
              `Speak request failed: ${response.status} ${response.statusText}`,
            );
          }

          const rawBlob = await response.blob();
          const audioBlob = rawBlob.type
            ? rawBlob
            : new Blob([rawBlob], { type: "audio/mpeg" });

          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);

          await new Promise<void>((resolve, reject) => {
            audio.onended = () => resolve();
            audio.onerror = () => reject(new Error("Audio playback failed"));
            audio.play().catch(reject);
          });

          URL.revokeObjectURL(audioUrl);

          if (scribeTokenRef.current) {
            await scribe.connect({
              token: scribeTokenRef.current,
              microphone: microphoneConfig,
            });
          }
        } catch (error) {
          console.error("Failed to fetch/play speak audio:", error);
        }
      }
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
    scribeTokenRef.current = token;

    await scribe.connect({
      token,
      microphone: microphoneConfig,
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
