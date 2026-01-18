import { CommitStrategy, useScribe } from "@elevenlabs/react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "~/lib/supabase";

const ScribeTokenUrl = "http://localhost:8000/scribe";

interface SpeakRequest {
  user_text: string;
  history?: Array<Record<string, string>> | null;
  b64_frame: string;
}
export default function MyComponent() {
  const scribeTokenRef = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const microphoneConfig = {
    echoCancellation: true,
    noiseSuppression: true,
  };

  useEffect(() => {
    let active = true;

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Webcam not supported");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setIsCameraReady(true);
      } catch (error) {
        console.error("Failed to start webcam:", error);
        setCameraError("Unable to access webcam.");
      }
    };

    startCamera();

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
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
        const capturedFrame = captureFrame();
        const encodedFrame = capturedFrame ? capturedFrame.split(",")[1] : b64;
        const reqBody: SpeakRequest = {
          user_text: data.text,
          history: null,
          b64_frame: encodedFrame,
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
    <div className="bg-white/95 rounded-lg shadow-lg p-6 space-y-4 border border-teal-900/10">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-teal-700">
          Live Session
        </p>
        <h2 className="text-2xl font-light text-teal-900">HealthSimple</h2>
      </div>

      <div className="space-y-2">
        {cameraError ? (
          <p className="text-sm text-rose-600">{cameraError}</p>
        ) : (
          <video
            ref={videoRef}
            muted
            playsInline
            className="w-full aspect-video rounded-md bg-gray-100 object-cover"
          />
        )}
        {!cameraError && !isCameraReady && (
          <p className="text-xs text-gray-500">Starting camera...</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleStart}
          disabled={scribe.isConnected}
          className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:bg-teal-700/50"
        >
          Start Recording
        </button>
        <button
          onClick={scribe.disconnect}
          disabled={!scribe.isConnected}
          className="rounded-md border border-teal-700/40 px-4 py-2 text-sm font-medium text-teal-800 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:border-teal-700/20 disabled:text-teal-700/40"
        >
          Stop
        </button>
      </div>

      <div className="space-y-2 text-sm text-gray-700">
        {scribe.partialTranscript && (
          <p className="rounded-md bg-teal-50 px-3 py-2 text-teal-900">
            Live: {scribe.partialTranscript}
          </p>
        )}

        <div className="space-y-2">
          {scribe.committedTranscripts.map((t) => (
            <p key={t.id} className="rounded-md bg-gray-100 px-3 py-2">
              {t.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
