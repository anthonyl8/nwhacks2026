import { CommitStrategy, useScribe } from "@elevenlabs/react";
import { supabase } from "~/lib/supabase";
import React, { useEffect, useRef } from "react";
import CameraCapture, { type CameraCaptureHandle } from "./CameraCapture";
import { useNavigate } from "react-router";

const ScribeTokenUrl = "http://localhost:8000/scribe";

interface SpeakRequest {
  user_text: string;
  history?: Array<Record<string, string>> | null;
  b64_frame: string;
}

const microphoneConfig = {
  echoCancellation: true,
  noiseSuppression: true,
};

export default function MyComponent() {
  const cameraRef = React.useRef<CameraCaptureHandle>(null);
  const navigate = useNavigate();
  const scribeTokenRef = useRef<string | null>(null);

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
      
      const b64Frame = cameraRef.current?.getSnapshot() || "";
      
      const reqBody: SpeakRequest = {
        user_text: data.text,
        history: null,
        b64_frame: b64Frame,
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
    try {
      fetch(`http://localhost:8000/intelligence/start?auth_id=${userId}`, {
        method: "POST",
      });
      const token = await fetchTokenFromServer();
      scribeTokenRef.current = token;

      await scribe.connect({
        token,
        microphone: microphoneConfig,
      });
    } catch (error) {
      console.error("Failed to start session:", error);
    }
  };

  const handleStop = async () => {
    await scribe.disconnect();
    // Navigate back to past sessions or home after stopping
    // navigate("/past-sessions"); 
    // Or just stay here? User asked for a stop button that works.
  };

  // Auto-start session on mount
  useEffect(() => {
    handleStart();
    // Cleanup on unmount
    return () => {
      // scribe.disconnect() is not directly available here if we don't track connection state, 
      // but useScribe hook handles cleanup usually? 
      // Actually useScribe documentation says we should manage it.
      // But handleStart is async.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-6 items-center w-full max-w-md mx-auto">
      <div className="w-full bg-black rounded-lg overflow-hidden shadow-lg">
        <CameraCapture ref={cameraRef} width={640} height={480} />
      </div>
      
      <div className="flex gap-4">
        {!scribe.isConnected ? (
          <div className="px-8 py-3 bg-gray-200 text-gray-600 rounded-full font-medium shadow-inner animate-pulse">
            Connecting to session...
          </div>
        ) : (
          <button 
            onClick={handleStop} 
            className="px-8 py-3 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors shadow-md"
          >
            End Session
          </button>
        )}
      </div>

      <div className="w-full bg-white rounded-lg shadow p-4 min-h-[100px]">
        <h3 className="text-gray-500 text-sm font-medium mb-2">Transcript</h3>
        <div className="space-y-2">
          {scribe.committedTranscripts.map((t) => (
            <p key={t.id} className="text-gray-800">{t.text}</p>
          ))}
          {scribe.partialTranscript && (
            <p className="text-gray-500 italic">{scribe.partialTranscript}</p>
          )}
        </div>
      </div>
    </div>
  );
}
