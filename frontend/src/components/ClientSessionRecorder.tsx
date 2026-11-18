import React, { useState, useRef, useEffect, useCallback } from "react";
import { Circle, StopCircle, Pause, Play, Download, Video } from "lucide-react";
import { useToast } from "./ui/use-toast";

interface ClientSessionRecorderProps {
  callId?: string;
  className?: string;
}

export const ClientSessionRecorder: React.FC<ClientSessionRecorderProps> = ({
  callId = "lecture",
  className = "",
}) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<"idle" | "recording" | "paused">("idle");
  const [duration, setDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupStream();
    };
  }, [cleanupStream]);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        toast({
          title: "Recording Not Supported",
          description: "Your browser does not support in-browser screen recording.",
          variant: "destructive",
        });
        return;
      }

      // Capture screen with system audio
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "browser",
        } as MediaTrackConstraints,
        audio: true,
      });

      // Optionally blend user microphone audio
      let combinedStream = displayStream;
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          const dest = audioCtx.createMediaStreamDestination();

          if (displayStream.getAudioTracks().length > 0) {
            const displayAudioSource = audioCtx.createMediaStreamSource(displayStream);
            displayAudioSource.connect(dest);
          }

          if (micStream.getAudioTracks().length > 0) {
            const micAudioSource = audioCtx.createMediaStreamSource(micStream);
            micAudioSource.connect(dest);
          }

          const combinedTracks = [
            ...displayStream.getVideoTracks(),
            ...dest.stream.getAudioTracks(),
          ];
          combinedStream = new MediaStream(combinedTracks);
        }
      } catch (micErr) {
        console.warn("Microphone capture skipped or denied, recording display audio only:", micErr);
      }

      streamRef.current = combinedStream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";

      const recorder = new MediaRecorder(combinedStream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const completeBlob = new Blob(chunksRef.current, { type: "video/webm" });
        setRecordedBlob(completeBlob);
        setStatus("idle");
        cleanupStream();

        toast({
          title: "Session Recording Ready",
          description: "Your lecture recording is packaged and ready to download as WebM.",
        });
      };

      // Listen for browser native "Stop Sharing" button
      const videoTrack = displayStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
          }
        };
      }

      recorder.start(1000); // 1-second timeslices
      setStatus("recording");
      setDuration(0);
      setRecordedBlob(null);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      toast({
        title: "Session Recording Started",
        description: "Capturing lecture screen and synchronized audio locally.",
      });
    } catch (err) {
      console.error("Failed to start screen recording:", err);
      toast({
        title: "Could not start recording",
        description: err instanceof Error ? err.message : "User cancelled screen share permission.",
        variant: "destructive",
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && status === "recording") {
      mediaRecorderRef.current.pause();
      setStatus("paused");
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && status === "paused") {
      mediaRecorderRef.current.resume();
      setStatus("recording");
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const downloadRecording = () => {
    if (!recordedBlob) return;
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement("a");
    const dateStr = new Date().toISOString().replace(/[:.]/g, "-");
    a.href = url;
    a.download = `collabclass-recording-${callId}-${dateStr}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {status === "idle" && !recordedBlob && (
        <button
          onClick={startRecording}
          title="Record lecture locally to WebM (MediaStream API)"
          className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b] text-white flex items-center gap-2 text-xs font-semibold transition-all border border-slate-700 shadow-sm"
        >
          <Circle className="w-3.5 h-3.5 fill-red-500 text-red-500 animate-pulse" />
          <span>Local Rec</span>
        </button>
      )}

      {status !== "idle" && (
        <div className="flex items-center gap-1.5 bg-red-950/40 border border-red-500/40 px-3 py-1.5 rounded-2xl text-xs font-medium text-red-300">
          <Circle className="w-2.5 h-2.5 fill-red-500 text-red-500 animate-ping" />
          <span className="font-mono text-white">{formatTime(duration)}</span>

          {status === "recording" ? (
            <button
              onClick={pauseRecording}
              title="Pause Recording"
              className="p-1 hover:bg-red-800/40 rounded-lg text-red-300 transition-colors ml-1"
            >
              <Pause className="w-3 h-3" />
            </button>
          ) : (
            <button
              onClick={resumeRecording}
              title="Resume Recording"
              className="p-1 hover:bg-red-800/40 rounded-lg text-emerald-400 transition-colors ml-1"
            >
              <Play className="w-3 h-3" />
            </button>
          )}

          <button
            onClick={stopRecording}
            title="Stop & Save Recording"
            className="p-1 hover:bg-red-800/40 rounded-lg text-white hover:text-red-200 transition-colors"
          >
            <StopCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {recordedBlob && status === "idle" && (
        <div className="flex items-center gap-2">
          <button
            onClick={downloadRecording}
            title="Download saved lecture (.webm)"
            className="cursor-pointer rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-white flex items-center gap-1.5 text-xs font-bold transition-all shadow-md animate-bounce"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download ({Math.round(recordedBlob.size / 1024 / 1024 * 10) / 10}MB)</span>
          </button>
          <button
            onClick={startRecording}
            title="Start new recording"
            className="cursor-pointer rounded-2xl bg-[#19232d] p-2 hover:bg-[#4c535b] text-white flex items-center justify-center border border-slate-700"
          >
            <Video className="w-3.5 h-3.5 text-slate-300" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ClientSessionRecorder;
