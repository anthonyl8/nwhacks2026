import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";

export type CameraCaptureHandle = {
  getSnapshot: () => string | null;
};

interface CameraCaptureProps {
  onCapture?: (imageBase64: string) => void;
  width?: number;
  height?: number;
}

const CameraCapture = forwardRef<CameraCaptureHandle, CameraCaptureProps>(({ onCapture, width = 320, height = 240 }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useImperativeHandle(ref, () => ({
    getSnapshot: () => {
      return captureFrame();
    }
  }));

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      setStream(mediaStream);
    } catch (err) {
      console.error("Error accessing webcam:", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const captureFrame = (): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return null;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // JPEG keeps payload smaller than PNG
    const imageBase64 = canvas.toDataURL("image/jpeg", 0.8);

    if (onCapture) {
      onCapture(imageBase64);
    }
    
    return imageBase64;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center" }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: "100%",
          maxWidth: `${width}px`,
          borderRadius: "8px",
          backgroundColor: "#000",
          transform: "scaleX(-1)" // Mirror effect
        }}
      />

      {/* Hidden canvas used for frame capture */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
});

export default CameraCapture;
