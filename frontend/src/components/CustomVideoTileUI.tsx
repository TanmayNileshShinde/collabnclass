import React, { useState, useEffect } from "react";
import {
  SfuModels,
  useParticipantViewContext,
  VideoPlaceholderProps,
  useCall,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { useUser } from "@clerk/clerk-react";
import { MicOff, Pin, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClassroom } from "@/contexts/ClassroomContext";

/**
 * Extracts up to two capitalized initials from a display name.
 */
export const getParticipantInitials = (name?: string): string => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

/**
 * Connection quality signal indicator bars.
 */
export const ConnectionQualityBars = ({
  quality,
}: {
  quality?: string | number;
}) => {
  const isPoor =
    quality === "poor" || quality === "bad" || quality === 3 || quality === 4;
  const isGood = quality === "good" || quality === 2;
  const isExcellent =
    quality === "excellent" || quality === 1 || quality === 0;

  return (
    <div
      className="flex items-end gap-0.5 h-3 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm border border-white/10"
      title={`Connection: ${quality ?? "Good"}`}
    >
      <span
        className={cn(
          "w-0.5 h-1 rounded-full",
          isPoor ? "bg-amber-400" : "bg-emerald-400"
        )}
      />
      <span
        className={cn(
          "w-0.5 h-2 rounded-full",
          isPoor
            ? "bg-white/20"
            : isGood || isExcellent
            ? "bg-emerald-400"
            : "bg-white/20"
        )}
      />
      <span
        className={cn(
          "w-0.5 h-3 rounded-full",
          isExcellent ? "bg-emerald-400" : "bg-white/20"
        )}
      />
    </div>
  );
};

/**
 * ActiveVideoRenderer
 * Resilient native HTML5 video renderer.
 * Binds MediaStream with explicit muted autoplay and ensures playback on Chromium.
 */
const ActiveVideoRenderer: React.FC<{
  stream: MediaStream;
  isLocal: boolean;
}> = ({ stream, isLocal }) => {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !stream) return;

    if (videoEl.srcObject !== stream) {
      videoEl.srcObject = stream;
    }
    videoEl.muted = true;
    videoEl.defaultMuted = true;

    const playVideo = () => {
      if (videoEl.paused) {
        videoEl.play().catch(() => {});
      }
    };

    playVideo();
    videoEl.addEventListener("loadedmetadata", playVideo);
    videoEl.addEventListener("canplay", playVideo);
    videoEl.addEventListener("loadeddata", playVideo);

    return () => {
      videoEl.removeEventListener("loadedmetadata", playVideo);
      videoEl.removeEventListener("canplay", playVideo);
      videoEl.removeEventListener("loadeddata", playVideo);
    };
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={cn(
        "w-full h-full object-cover",
        isLocal && "-scale-x-100"
      )}
    />
  );
};

/**
 * CustomVideoPlaceholder
 * Displayed inside ParticipantView. If a video stream is active (SFU or local camera),
 * it renders the video element via ActiveVideoRenderer. Otherwise, it displays the cyberpunk avatar.
 */
export const CustomVideoPlaceholder: React.FC<VideoPlaceholderProps> = ({
  participant,
  style,
  className,
}) => {
  const { user } = useUser();
  const [imageError, setImageError] = useState(false);
  const { raisedHands } = useClassroom();
  const isSpeaking = participant.isSpeaking;
  const isHandRaised = raisedHands.has(participant.userId);
  const displayName = participant.name || participant.userId || "Participant";
  const initials = getParticipantInitials(displayName);
  const isLocal =
    participant.isLocalParticipant || participant.userId === user?.id;

  const { useCameraState } = useCallStateHooks();
  const { status: cameraStatus, mediaStream: localMediaStream } = useCameraState();

  // Determine active video stream: SFU stream or reactive local camera mediaStream
  const activeStream =
    participant.videoStream ||
    (isLocal && cameraStatus === "enabled" ? localMediaStream : undefined);

  // Ensure local tracks are unmuted if camera status is enabled
  useEffect(() => {
    if (isLocal && cameraStatus === "enabled" && localMediaStream) {
      localMediaStream.getVideoTracks().forEach((track) => {
        if (!track.enabled) track.enabled = true;
      });
    }
  }, [isLocal, cameraStatus, localMediaStream]);

  const hasLiveVideoTrack = Boolean(
    activeStream &&
      activeStream.getVideoTracks().length > 0 &&
      activeStream.getVideoTracks().some((t) => t.readyState === "live" && t.enabled)
  );

  return (
    <div
      style={style}
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center select-none overflow-hidden",
        !hasLiveVideoTrack && "bg-gradient-to-br from-[#020914] via-[#041324] to-[#020710]",
        className
      )}
    >
      {hasLiveVideoTrack && activeStream ? (
        <ActiveVideoRenderer stream={activeStream} isLocal={isLocal} />
      ) : (
        <>
          {/* Atmospheric Ambient Glow */}
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-300 pointer-events-none",
              isSpeaking
                ? "opacity-60 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/25 via-blue-600/10 to-transparent"
                : isHandRaised
                ? "opacity-50 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/25 via-orange-600/10 to-transparent"
                : "opacity-20 bg-[radial-gradient(circle_at_center,_rgba(0,180,255,0.15)_0%,_transparent_70%)]"
            )}
          />

          {/* Cyber Frame Grid Pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(0,200,255,0.8) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,200,255,0.8) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Avatar Container with Active Speaker Ring or Hand Raised Ring */}
          <div className="relative z-10 flex flex-col items-center px-4">
            <div
              className={cn(
                "relative flex items-center justify-center rounded-3xl transition-all duration-300",
                "w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32",
                isSpeaking
                  ? "ring-4 ring-cyan-400 ring-offset-4 ring-offset-[#030a16] shadow-[0_0_35px_rgba(0,220,255,0.7)] scale-105"
                  : isHandRaised
                  ? "ring-4 ring-amber-400 ring-offset-4 ring-offset-[#030a16] shadow-[0_0_30px_rgba(245,158,11,0.6)]"
                  : "ring-2 ring-cyan-500/25 shadow-2xl"
              )}
            >
              {participant.image && !imageError ? (
                <img
                  src={participant.image}
                  alt={displayName}
                  onError={() => setImageError(true)}
                  className="w-full h-full rounded-3xl object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-3xl bg-gradient-to-tr from-blue-700 via-sky-600 to-cyan-500 flex items-center justify-center text-white text-2xl sm:text-3xl md:text-4xl font-bold tracking-wider font-syne shadow-inner">
                  {initials}
                </div>
              )}

              {/* Active audio ripple halo */}
              {isSpeaking && (
                <span className="absolute inset-0 rounded-3xl border-2 border-cyan-400 animate-ping opacity-25 pointer-events-none" />
              )}

              {/* Hand raised badge on avatar */}
              {isHandRaised && (
                <span className="absolute -top-2 -right-2 z-20 w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-base shadow-[0_0_15px_rgba(245,158,11,0.85)] border-2 border-[#030a16] animate-bounce">
                  ✋
                </span>
              )}
            </div>

            {/* Hand Raised badge on avatar placeholder */}
            {isHandRaised && (
              <div className="flex items-center gap-1 mt-3 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                <span className="text-xs">✋</span>
                <span className="text-[11px] font-bold text-amber-300 tracking-wide">
                  Hand Raised
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

/**
 * CustomParticipantViewUI
 * Overlaid on every participant's video tile inside ParticipantView.
 */
export const CustomParticipantViewUI = () => {
  const { participant } = useParticipantViewContext();
  const call = useCall();
  const { user } = useUser();
  const { raisedHands } = useClassroom();
  const { useMicrophoneState } = useCallStateHooks();
  const { isMute: isLocalMicMuted } = useMicrophoneState();

  const isSpeaking = participant.isSpeaking;
  const isHandRaised = raisedHands.has(participant.userId);
  const isLocal =
    participant.isLocalParticipant || participant.userId === user?.id;
  const isHost =
    call?.state.createdBy?.id === participant.userId ||
    call?.state.custom?.creatorId === participant.userId;
  const isPinned = Boolean(participant.pin);

  // Audio track status: reactive microphone state for local participant, published SFU track for remote
  const isMuted = isLocal
    ? Boolean(isLocalMicMuted)
    : !participant.publishedTracks.includes(SfuModels.TrackType.AUDIO) &&
      !participant.audioStream;
  const displayName = participant.name || participant.userId || "Participant";

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl transition-all duration-200">
      {/* 1. Tile Border & Glow: Active Speaker or Hand Raised */}
      <div
        className={cn(
          "absolute inset-0 rounded-2xl pointer-events-none transition-all duration-200 z-20",
          isSpeaking
            ? "ring-2 sm:ring-4 ring-cyan-400 ring-offset-1 ring-offset-[#020813] shadow-[inset_0_0_24px_rgba(0,220,255,0.35),0_0_24px_rgba(0,220,255,0.45)]"
            : isHandRaised
            ? "ring-2 sm:ring-4 ring-amber-400 ring-offset-1 ring-offset-[#020813] shadow-[inset_0_0_20px_rgba(245,158,11,0.3),0_0_20px_rgba(245,158,11,0.4)]"
            : "ring-1 ring-white/10"
        )}
      />

      {/* 2. Top-Left: Audio & Speaking Status Badges */}
      <div className="absolute top-2.5 left-2.5 z-30 flex items-center gap-1.5 pointer-events-auto">
        {isSpeaking ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-950/90 backdrop-blur-md border border-cyan-400/50 text-cyan-300 text-xs font-semibold shadow-[0_0_15px_rgba(0,220,255,0.4)]">
            <div className="flex items-end gap-0.5 h-3 w-4">
              <span className="w-0.5 h-1.5 bg-cyan-300 rounded-full animate-pulse" />
              <span className="w-0.5 h-3 bg-cyan-300 rounded-full animate-pulse" />
              <span className="w-0.5 h-2 bg-cyan-300 rounded-full animate-pulse" />
            </div>
            <span className="text-[11px] tracking-wide">Speaking</span>
          </div>
        ) : isMuted ? (
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-red-950/85 backdrop-blur-md border border-rose-500/40 text-rose-300 text-[11px] font-medium shadow-md">
            <MicOff className="w-3 h-3 text-rose-400" />
            <span className="hidden sm:inline">Muted</span>
          </div>
        ) : null}

        {/* ✋ Hand Raised Badge on Tile */}
        {isHandRaised && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-950/90 backdrop-blur-md border border-amber-400/70 text-amber-300 text-xs font-semibold shadow-[0_0_16px_rgba(245,158,11,0.5)] animate-bounce">
            <span className="text-sm leading-none">✋</span>
            <span className="text-[11px] tracking-wide font-bold">Hand Raised</span>
          </div>
        )}
      </div>

      {/* 3. Top-Right: Connection & Pinned Badges */}
      <div className="absolute top-2.5 right-2.5 z-30 flex items-center gap-1.5 pointer-events-auto">
        {isPinned && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-cyan-500/20 backdrop-blur-md border border-cyan-400/50 text-cyan-300 text-[10px] font-medium shadow-sm">
            <Pin className="w-3 h-3 fill-cyan-400 text-cyan-400" />
            <span>Pinned</span>
          </div>
        )}
        <ConnectionQualityBars quality={participant.connectionQuality} />
      </div>

      {/* 4. Bottom-Left: Name & Role Badges Pill (Clean Single Badge, No Duplicate Text) */}
      <div className="absolute bottom-2.5 left-2.5 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#040e1c]/90 backdrop-blur-md border border-[rgba(0,180,255,0.25)] shadow-xl max-w-[calc(100%-20px)] pointer-events-auto">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
        <span className="text-xs font-semibold text-white truncate max-w-[120px] sm:max-w-[180px]">
          {displayName}
        </span>

        {isLocal && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/25 text-blue-300 border border-blue-500/40 shrink-0">
            You
          </span>
        )}

        {isHost && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/25 text-amber-300 border border-amber-500/40 shrink-0">
            <ShieldCheck className="w-2.5 h-2.5 text-amber-400" />
            Host
          </span>
        )}
      </div>
    </div>
  );
};

export default CustomParticipantViewUI;
