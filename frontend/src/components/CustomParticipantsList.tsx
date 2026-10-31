import { useState, useMemo } from "react";
import { useCallStateHooks, useCall } from "@stream-io/video-react-sdk";
import { useUser } from "@clerk/clerk-react";
import {
  X,
  Search,
  ShieldCheck,
  Mic,
  MicOff,
  Hand,
  VolumeX,
  Pin,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useClassroom } from "@/contexts/ClassroomContext";
import { cn } from "@/lib/utils";

interface CustomParticipantsListProps {
  onClose?: () => void;
  embedded?: boolean;
}

const CustomParticipantsList = ({
  onClose,
  embedded = false,
}: CustomParticipantsListProps) => {
  const { user } = useUser();
  const call = useCall();
  const { useParticipants, useLocalParticipant } = useCallStateHooks();
  const participants = useParticipants();
  const localParticipant = useLocalParticipant();
  const [searchQuery, setSearchQuery] = useState("");

  const {
    raisedHands,
    isHost,
    lowerHand,
    lowerAllHands,
    muteAll,
    muteParticipant,
  } = useClassroom();

  const getParticipantDisplayName = (participant: any) => {
    if (participant.userId === user?.id) {
      return user?.username || user?.fullName || user?.firstName || "Me";
    }
    if (participant.name) return participant.name;
    return participant.userId || "Unknown User";
  };

  const getParticipantImage = (participant: any) => {
    if (participant.userId === user?.id) {
      return user?.imageUrl;
    }
    return participant.image;
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const allParticipants = useMemo(() => {
    return localParticipant
      ? [
          localParticipant,
          ...participants.filter((p) => p.userId !== localParticipant.userId),
        ]
      : participants;
  }, [localParticipant, participants]);

    // sort participants
  const sortedParticipants = useMemo(() => {
    const hostId =
      call?.state.createdBy?.id || call?.state.custom?.creatorId;

    return [...allParticipants].sort((a, b) => {
      const isAHost = a.userId === hostId;
      const isBHost = b.userId === hostId;
      if (isAHost && !isBHost) return -1;
      if (!isAHost && isBHost) return 1;

      const aHand = raisedHands.get(a.userId);
      const bHand = raisedHands.get(b.userId);

      if (aHand && !bHand) return -1;
      if (!aHand && bHand) return 1;
      if (aHand && bHand) {
        return aHand.raisedAt - bHand.raisedAt;
      }

      return 0;
    });
  }, [allParticipants, call, raisedHands]);

  const filteredParticipants = useMemo(() => {
    return sortedParticipants.filter((participant) => {
      const name = getParticipantDisplayName(participant).toLowerCase();
      return name.includes(searchQuery.toLowerCase().trim());
    });
  }, [sortedParticipants, searchQuery, user]);

  const totalRaisedCount = raisedHands.size;

  const content = (
    <div className="flex flex-col h-full w-full min-h-0 bg-transparent text-white select-none">
      {/* Standalone Header */}
      {!embedded && (
        <div className="flex items-center justify-between p-4 border-b border-[rgba(0,180,255,0.15)] bg-[#040e1c]">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Participants</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              {allParticipants.length}
            </span>
          </h2>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl"
            >
              <X size={18} />
            </Button>
          )}
        </div>
      )}

      {/* Host Action Toolbar (Visible when local user is Host/Instructor) */}
      {isHost && (
        <div className="p-3 bg-[#030d1a] border-b border-[rgba(0,180,255,0.15)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Classroom Host Controls
            </span>
            {totalRaisedCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/25 text-amber-300 border border-amber-400/40 animate-pulse">
                {totalRaisedCount} {totalRaisedCount === 1 ? "Hand" : "Hands"} Raised
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            {/* Mute All Button */}
            <button
              onClick={() => muteAll()}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-rose-200 transition-all shadow-sm"
              title="Mute microphones for all participants"
            >
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              <span>Mute All</span>
            </button>

            {/* Lower All Hands Button (appears if hands are raised) */}
            {totalRaisedCount > 0 && (
              <button
                onClick={() => lowerAllHands()}
                className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-amber-200 transition-all shadow-sm"
                title="Lower all student hands"
              >
                <Hand className="w-3.5 h-3.5 text-amber-400" />
                <span>Lower Hands ({totalRaisedCount})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Embedded Search Filter & Meta Header */}
      <div className="p-3 border-b border-[rgba(0,180,255,0.12)] bg-[#020b16]/60 space-y-2">
        <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
          <span className="font-medium">Class Roster</span>
          <span className="font-semibold text-cyan-400">
            {allParticipants.length} connected
          </span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student or teacher..."
            className="pl-9 h-8 text-xs bg-[#061527]/80 border-[rgba(0,180,255,0.18)] text-white placeholder:text-neutral-500 rounded-xl focus-visible:ring-1 focus-visible:ring-cyan-400"
          />
        </div>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
        {filteredParticipants.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-neutral-400 text-xs">
            <p>No participants match "{searchQuery}"</p>
          </div>
        ) : (
          filteredParticipants.map((participant, index) => {
            const displayName = getParticipantDisplayName(participant);
            const participantImage = getParticipantImage(participant);
            const isLocal = participant.userId === user?.id;
            const isCallHost =
              participant.userId === call?.state.createdBy?.id ||
              participant.userId === call?.state.custom?.creatorId;

            const handInfo = raisedHands.get(participant.userId);
            const hasHandRaised = !!handInfo;
            const isMuted = !participant.audioStream;
            const isPinned = !!participant.pin;

            return (
              <div
                key={participant.userId || index}
                className={cn(
                  "group relative flex items-center justify-between p-2.5 rounded-xl transition-all border",
                  hasHandRaised
                    ? "bg-amber-500/10 border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                    : "bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.05] hover:border-[rgba(0,180,255,0.25)]"
                )}
              >
                {/* Left: Avatar + Details */}
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  {/* Avatar */}
                  <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 via-cyan-600 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold overflow-hidden shadow-inner flex-shrink-0">
                    {participantImage ? (
                      <img
                        src={participantImage}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{getInitials(displayName)}</span>
                    )}

                    {/* Online indicator dot */}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#040e1c]" />
                  </div>

                  {/* Name & Badges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-medium text-white truncate max-w-[130px]">
                        {displayName}
                      </p>

                      {isLocal && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 flex-shrink-0">
                          You
                        </span>
                      )}

                      {isCallHost && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex-shrink-0">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          Host
                        </span>
                      )}
                    </div>

                    {/* Subtitle: Hand raised indicator or User ID */}
                    {hasHandRaised ? (
                      <p className="text-[11px] font-semibold text-amber-300 flex items-center gap-1 mt-0.5">
                        <span className="animate-hand-bounce inline-block">✋</span>
                        <span>Question queued</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                        {participant.userId
                          ? `@${participant.userId.slice(0, 14)}`
                          : "Attendee"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Actions & Status */}
                <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                  {/* Pin Indicator */}
                  {isPinned && (
                    <span
                      title="Pinned on screen"
                      className="p-1 text-cyan-400"
                    >
                      <Pin className="w-3.5 h-3.5 fill-cyan-400" />
                    </span>
                  )}

                  {/* Audio Status */}
                  <span
                    title={isMuted ? "Muted" : "Microphone Active"}
                    className={cn(
                      "p-1.5 rounded-lg flex items-center justify-center transition-colors",
                      isMuted
                        ? "text-rose-400 bg-rose-500/10"
                        : "text-emerald-400 bg-emerald-500/10"
                    )}
                  >
                    {isMuted ? (
                      <MicOff className="w-3.5 h-3.5" />
                    ) : (
                      <Mic className="w-3.5 h-3.5" />
                    )}
                  </span>

                  {/* Hand Raised Action Button (Allows Host or Self to Lower) */}
                  {hasHandRaised && (isHost || isLocal) && (
                    <button
                      onClick={() => lowerHand(participant.userId)}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 flex items-center gap-1 transition-all"
                      title="Lower this hand"
                    >
                      <span>Lower</span>
                      <X className="w-3 h-3" />
                    </button>
                  )}

                  {/* Host Individual Mute Button (Only visible to Host on unmuted peers) */}
                  {isHost && !isLocal && !isMuted && (
                    <button
                      onClick={() => muteParticipant(participant.userId)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-rose-300 hover:text-white bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/30 transition-all"
                      title="Mute this participant"
                    >
                      <VolumeX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="fixed right-10 flex flex-col h-[calc(100vh-86px)] w-[350px] bg-[#040e1c] border-l border-[rgba(0,180,255,0.18)] shadow-2xl transition-colors">
      {content}
    </div>
  );
};

export default CustomParticipantsList;
