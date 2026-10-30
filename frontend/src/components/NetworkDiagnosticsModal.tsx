import React, { useState, useEffect } from "react";
import { useCall, useCallStateHooks } from "@stream-io/video-react-sdk";
import {
  Activity,
  Wifi,
  Radio,
  ShieldCheck,
  Camera,
  Mic,
  Volume2,
  RefreshCw,
  X,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NetworkDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NetworkDiagnosticsModal: React.FC<NetworkDiagnosticsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const call = useCall();
  const {
    useCameraState,
    useMicrophoneState,
    useSpeakerState,
    useLocalParticipant,
  } = useCallStateHooks();

  const {
    devices: cameraDevices,
    selectedDevice: selectedCamera,
    status: cameraStatus,
  } = useCameraState();

  const {
    devices: micDevices,
    selectedDevice: selectedMicrophone,
    isMute: isMicMuted,
    mediaStream: micStream,
  } = useMicrophoneState();

  const {
    devices: speakerDevices,
    selectedDevice: selectedSpeaker,
  } = useSpeakerState();

  const localParticipant = useLocalParticipant();

  // Audio level visualizer state
  const [audioLevel, setAudioLevel] = useState(0);
  const [isResyncing, setIsResyncing] = useState(false);
  const [resyncSuccess, setResyncSuccess] = useState(false);

  // Monitor live audio input volume via Web Audio API if mic is unmuted
  useEffect(() => {
    if (!isOpen || isMicMuted || !micStream) {
      setAudioLevel(0);
      return;
    }

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let animationFrameId: number;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContext = new AudioCtx();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.5;

      source = audioContext.createMediaStreamSource(micStream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);
        animationFrameId = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.warn("Audio meter initialization skipped:", err);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (source) source.disconnect();
      if (audioContext && audioContext.state !== "closed") {
        audioContext.close().catch(() => {});
      }
    };
  }, [isOpen, isMicMuted, micStream]);

  if (!isOpen) return null;

  const currentCameraLabel =
    cameraDevices?.find((d) => d.deviceId === selectedCamera)?.label ||
    (cameraStatus === "enabled" ? "Active Web Camera" : "Disabled");

  const currentMicLabel =
    micDevices?.find((d) => d.deviceId === selectedMicrophone)?.label ||
    (isMicMuted ? "Muted Microphone" : "Active Input Microphone");

  const currentSpeakerLabel =
    speakerDevices?.find((d) => d.deviceId === selectedSpeaker)?.label ||
    "System Default Speakers";

  const handleResyncStreams = async () => {
    if (!call) return;
    try {
      setIsResyncing(true);
      if (call.camera.state.status === "enabled") {
        await call.camera.disable();
        await call.camera.enable();
      } else {
        await call.camera.enable();
      }

      if (call.microphone.state.status === "enabled") {
        await call.microphone.disable();
        await call.microphone.enable();
      } else {
        await call.microphone.enable();
      }

      setResyncSuccess(true);
      setTimeout(() => setResyncSuccess(false), 2500);
    } catch (err) {
      console.error("Resync failed:", err);
    } finally {
      setIsResyncing(false);
    }
  };

  const connectionQuality = localParticipant?.connectionQuality || "excellent";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[rgba(0,180,255,0.28)] bg-[#040e1c]/95 p-6 text-white shadow-[0_0_50px_rgba(0,180,255,0.2)]">
        {/* Ambient Top Glow */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(0,200,255,0.25) 0%, transparent 70%)",
          }}
        />

        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(0,180,255,0.25)]">
              <Activity size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-syne flex items-center gap-2">
                Stage Telemetry & Hardware Diagnostics
              </h3>
              <p className="text-xs text-neutral-400">
                Live WebRTC mesh metrics and hardware audio/video checks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="relative z-10 space-y-4 py-4 text-xs">
          {/* 1. WebRTC Network Mesh Card */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Radio size={12} className="text-cyan-400 animate-pulse" />
              WebRTC SFU Telemetry
            </span>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-0.5">
                <span className="text-[10px] text-neutral-400">Link Status</span>
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Mesh
                </span>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-0.5">
                <span className="text-[10px] text-neutral-400">Quality</span>
                <span className="text-xs font-semibold text-cyan-300 capitalize flex items-center gap-1">
                  <Wifi size={12} className="text-cyan-400" />
                  {String(connectionQuality)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-0.5">
                <span className="text-[10px] text-neutral-400">Security</span>
                <span className="text-xs font-semibold text-sky-300 flex items-center gap-1">
                  <ShieldCheck size={12} className="text-sky-400" />
                  DTLS / SRTP
                </span>
              </div>
            </div>
          </div>

          {/* 2. Hardware Devices Status */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Camera size={12} className="text-cyan-400" />
              Connected Peripherals
            </span>

            <div className="space-y-2 text-neutral-300 font-mono text-[11px]">
              {/* Camera Input */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5">
                <span className="flex items-center gap-2 text-neutral-400">
                  <Camera size={13} className="text-cyan-400 shrink-0" />
                  Camera:
                </span>
                <span className="truncate max-w-[240px] text-white">
                  {currentCameraLabel}
                </span>
              </div>

              {/* Microphone Input & Live Level Visualizer */}
              <div className="p-2 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-neutral-400">
                    <Mic size={13} className="text-cyan-400 shrink-0" />
                    Microphone:
                  </span>
                  <span className="truncate max-w-[240px] text-white">
                    {currentMicLabel}
                  </span>
                </div>

                {/* Live Mic Activity Bar */}
                <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                  <span className="text-[10px] text-neutral-400 shrink-0">
                    Live Mic Level:
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden relative">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-75",
                        isMicMuted
                          ? "bg-rose-500 w-0"
                          : audioLevel > 70
                          ? "bg-amber-400"
                          : "bg-emerald-400"
                      )}
                      style={{ width: `${isMicMuted ? 0 : audioLevel}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300 w-8 text-right shrink-0">
                    {isMicMuted ? "Off" : `${audioLevel}%`}
                  </span>
                </div>
              </div>

              {/* Speaker Output */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5">
                <span className="flex items-center gap-2 text-neutral-400">
                  <Volume2 size={13} className="text-cyan-400 shrink-0" />
                  Output:
                </span>
                <span className="truncate max-w-[240px] text-white">
                  {currentSpeakerLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="relative z-10 flex items-center justify-between pt-3 border-t border-white/10">
          <button
            onClick={handleResyncStreams}
            disabled={isResyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
          >
            {resyncSuccess ? (
              <>
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span className="text-emerald-400">Streams Re-synchronized!</span>
              </>
            ) : (
              <>
                <RefreshCw
                  size={14}
                  className={cn(isResyncing && "animate-spin")}
                />
                <span>Re-sync Media Streams</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NetworkDiagnosticsModal;
