"use client";

import { useRef, useState, useEffect } from "react";

interface Props {
  onRecorded: (blob: Blob, fileName: string) => void;
  existingUrl?: string;
}

type Mode = "idle" | "requesting" | "ready" | "recording" | "preview" | "upload-only";

export default function VideoRecorder({ onRecorded, existingUrl }: Props) {
  const [mode, setMode] = useState<Mode>("idle");
  const [countdown, setCountdown] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(existingUrl ?? "");
  const [isIOS, setIsIOS] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Detect iOS — MediaRecorder not supported on iOS Safari
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);
    if (ios) setMode("upload-only");
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startCamera() {
    setError("");
    setMode("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play();
      }
      setMode("ready");
    } catch {
      setError("Could not access camera. Please check permissions or use the upload option below.");
      setMode("idle");
    }
  }

  function startRecording() {
    if (!streamRef.current) return;
    chunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm")
      ? "video/webm"
      : "video/mp4";

    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const ext = mimeType.includes("mp4") ? "mp4" : "webm";
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = url;
        videoRef.current.muted = false;
      }
      stopStream();
      setMode("preview");
      onRecorded(blob, `recording.${ext}`);
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setMode("recording");
    setDuration(0);
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
  }

  function reRecord() {
    setPreviewUrl("");
    if (videoRef.current) {
      videoRef.current.src = "";
      videoRef.current.srcObject = null;
    }
    startCamera();
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setMode("preview");
    onRecorded(file, file.name);
  }

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  return (
    <div className="space-y-4">
      {/* Video element */}
      {(mode === "ready" || mode === "recording" || mode === "preview") && (
        <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            controls={mode === "preview"}
            playsInline
          />
          {mode === "recording" && (
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white text-xs font-mono">{fmt(duration)}</span>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="space-y-2">
        {mode === "idle" && !isIOS && (
          <button
            onClick={startCamera}
            className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-stone-300 py-8 text-sm text-stone-500 hover:border-stone-400 hover:text-stone-700 transition-colors"
          >
            <CameraIcon /> Start recording
          </button>
        )}

        {mode === "requesting" && (
          <div className="w-full flex items-center justify-center py-8 text-sm text-stone-400">
            Requesting camera access…
          </div>
        )}

        {mode === "ready" && (
          <button
            onClick={startRecording}
            className="w-full bg-red-600 text-white rounded-lg py-3 text-sm font-medium hover:bg-red-700 transition-colors"
          >
            ● Start recording
          </button>
        )}

        {mode === "recording" && (
          <button
            onClick={stopRecording}
            className="w-full bg-stone-900 text-white rounded-lg py-3 text-sm font-medium hover:bg-stone-800 transition-colors"
          >
            ■ Stop recording
          </button>
        )}

        {mode === "preview" && (
          <button
            onClick={reRecord}
            className="w-full border border-stone-300 text-stone-700 rounded-lg py-2.5 text-sm font-medium hover:bg-stone-50 transition-colors"
          >
            Re-record
          </button>
        )}

        {/* Upload option — always visible except during camera use */}
        {(mode === "idle" || mode === "upload-only" || mode === "preview") && (
          <label className="block cursor-pointer">
            <span className="w-full flex items-center justify-center gap-2 rounded-lg border border-stone-300 py-2.5 text-sm text-stone-600 hover:bg-stone-50 transition-colors">
              <UploadIcon />
              {mode === "preview" ? "Upload a different file" : isIOS ? "Upload a video file" : "Or upload a file instead"}
            </span>
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/*"
              onChange={handleFileUpload}
              className="sr-only"
            />
          </label>
        )}

        {existingUrl && mode === "idle" && (
          <button
            onClick={() => {
              setPreviewUrl(existingUrl);
              if (videoRef.current) {
                videoRef.current.src = existingUrl;
                videoRef.current.muted = false;
              }
              setMode("preview");
            }}
            className="w-full text-sm text-stone-500 hover:text-stone-700 py-1"
          >
            View current recording
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* iOS notice */}
      {isIOS && (
        <p className="text-xs text-stone-400">
          In-browser recording isn&rsquo;t supported on iOS. Please record a video on your device
          and upload it using the button above.
        </p>
      )}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}
