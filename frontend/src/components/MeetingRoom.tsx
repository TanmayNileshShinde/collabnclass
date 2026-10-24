import { useState, useEffect } from "react";
import {
  CallControls,
  CallStatsButton,
  CallingState,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { useSearchParams } from "react-router-dom";
import { useToast } from "./ui/use-toast";
import Chatbot from "./Chatbot";
import CustomParticipantsList from "./CustomParticipantsList";
import MeetingChat from "./MeetingChat";
import GithubRepoImporter from "./GithubRepoImporter";
import Whiteboard from "./Whiteboard";
import MeetingSideDock, { SideDockTab } from "./MeetingSideDock";
import {
  CustomVideoPlaceholder,
  CustomParticipantViewUI,
} from "./CustomVideoTileUI";
import { useCall } from "@stream-io/video-react-sdk";
import {
  Users,
  MessageSquare,
  Github,
  Bot,
  Edit,
  Copy,
  Info,
  LayoutList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import Loader from "./Loader";
import EndCallButton from "./EndCallButton";
import { formatMeetingCode } from "@/lib/meetingUtils";
import AttendanceService from "@/services/AttendanceService";
import { useUser } from "@clerk/clerk-react";
import { useChat } from "@/contexts/ChatContext";
import { ClassroomProvider, useClassroom } from "@/contexts/ClassroomContext";

type CallLayoutType = "grid" | "speaker-left" | "speaker-right";

const MeetingRoomContent = () => {
  const [searchParams] = useSearchParams();
  const isPersonalRoom = !!searchParams.get("personal");
  const navigate = useNavigate();
  const [layout, setLayout] = useState<CallLayoutType>("speaker-left");

  // Unified Side Dock state
  const [isDockOpen, setIsDockOpen] = useState(false);
  const [activeDockTab, setActiveDockTab] = useState<SideDockTab>("chat");
  const [showWhiteboard, setShowWhiteboard] = useState(false);

  const { useCallCallingState, useParticipants, useLocalParticipant } =
    useCallStateHooks();
  const participants = useParticipants();
  const localParticipant = useLocalParticipant();
  const { messages } = useChat();
  const { isHandRaised, toggleHandRaise, raisedHands } = useClassroom();

  const call = useCall();
  const { toast } = useToast();
  const { user } = useUser();

  const callingState = useCallCallingState();

  // Track attendance when user joins or leaves meeting
  useEffect(() => {
    if (!call || !user || callingState !== CallingState.JOINED) return;

    const meetingId = call.id;
    const userId = user.id;
    const userName = user.fullName || user.username || "Unknown User";

    // Record join when user successfully joins
    if (callingState === CallingState.JOINED && meetingId && userId) {
      AttendanceService.recordJoin(meetingId, userId, userName).catch(
        (error) => {
          console.error("Failed to record attendance join:", error);
        }
      );
    }

    // Set up leave tracking when component unmounts or user leaves
    const handleLeave = (isUnload = false) => {
      if (meetingId && userId) {
        if (isUnload) {
          // Use keepalive / beacon on page unload to ensure request is never aborted
          AttendanceService.recordLeaveBeacon(meetingId, userId);
        } else {
          AttendanceService.recordLeave(meetingId, userId).catch((error) => {
            console.error("Failed to record attendance leave:", error);
          });
        }
      }
    };

    // Listen for page unload (user closes browser/navigates away)
    const handleBeforeUnload = () => {
      handleLeave(true);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);
      handleLeave(false);
    };
  }, [call, user, callingState]);

  // Track participant join/leave events for other users
  useEffect(() => {
    if (!call) return;

    const handleParticipantJoined = (event: any) => {
      const participant = event.participant;
      if (participant && participant.userId && participant.name) {
        AttendanceService.recordJoin(
          call.id,
          participant.userId,
          participant.name
        ).catch((error) => {
          console.error("Failed to record participant join:", error);
        });
      }
    };

    const handleParticipantLeft = (event: any) => {
      const participant = event.participant;
      if (participant && participant.userId) {
        AttendanceService.recordLeave(call.id, participant.userId).catch(
          (error) => {
            console.error("Failed to record participant leave:", error);
          }
        );
      }
    };

    call.on("participantJoined", handleParticipantJoined);
    call.on("participantLeft", handleParticipantLeft);

    return () => {
      call.off("participantJoined", handleParticipantJoined);
      call.off("participantLeft", handleParticipantLeft);
    };
  }, [call]);

  if (callingState !== CallingState.JOINED) return <Loader />;

  const meetingCode = call?.state.custom?.meetingCode;
  const meetingHeading = call?.state.custom?.heading || "Meeting";
  const meetingSubheading = call?.state.custom?.subheading;
  const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin;
  const meetingLink = call ? `${baseUrl}/meeting/${call.id}` : "";

  const totalParticipantsCount =
    (localParticipant ? 1 : 0) +
    participants.filter((p) => p.userId !== localParticipant?.userId).length;

  const handleToggleDock = (tab: SideDockTab) => {
    if (isDockOpen && activeDockTab === tab) {
      setIsDockOpen(false);
    } else {
      setActiveDockTab(tab);
      setIsDockOpen(true);
    }
  };

  const copyMeetingCode = () => {
    if (meetingCode) {
      navigator.clipboard.writeText(meetingCode);
      toast({ title: "Meeting Code Copied" });
    }
  };

  const copyMeetingLink = () => {
    if (meetingLink) {
      navigator.clipboard.writeText(meetingLink);
      toast({ title: "Meeting Link Copied" });
    }
  };

  const CallLayout = () => {
    switch (layout) {
      case "grid":
        return (
          <PaginatedGridLayout
            VideoPlaceholder={CustomVideoPlaceholder}
            ParticipantViewUI={CustomParticipantViewUI}
          />
        );
      case "speaker-right":
        return (
          <SpeakerLayout
            participantsBarPosition="left"
            VideoPlaceholder={CustomVideoPlaceholder}
            ParticipantViewUISpotlight={CustomParticipantViewUI}
            ParticipantViewUIBar={CustomParticipantViewUI}
          />
        );
      default:
        return (
          <SpeakerLayout
            participantsBarPosition="right"
            VideoPlaceholder={CustomVideoPlaceholder}
            ParticipantViewUISpotlight={CustomParticipantViewUI}
            ParticipantViewUIBar={CustomParticipantViewUI}
          />
        );
    }
  };

  return (
    <section className="relative h-screen w-full overflow-hidden pt-4 text-white bg-[#020813]">
      {/* Meeting Header */}
      <div className="fixed top-4 left-4 right-20 z-30 pointer-events-none">
        <div className="glassmorphism-card px-4 py-3 rounded-2xl max-w-md pointer-events-auto border border-white/10 bg-[#040e1c]/80 backdrop-blur-xl shadow-lg">
          <h1 className="text-lg font-bold text-white mb-0.5 truncate">
            {meetingHeading}
          </h1>
          {meetingSubheading && (
            <p className="text-xs text-white/70 truncate">{meetingSubheading}</p>
          )}
        </div>
      </div>

      {/* Meeting Info Button - Top Right */}
      {meetingCode && (
        <div className="fixed top-4 right-4 z-30">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="cursor-pointer rounded-2xl bg-[#040e1c]/80 backdrop-blur-xl border border-white/10 px-3.5 py-2 hover:bg-[#091b33] transition-colors shadow-lg">
                <Info size={18} className="text-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="bottom"
              className="border-[rgba(0,180,255,0.2)] bg-[#040e1c] text-white min-w-[280px] p-4 shadow-2xl"
            >
              <DropdownMenuLabel className="text-sm font-semibold mb-3">
                Meeting Information
              </DropdownMenuLabel>

              {/* Meeting Heading and Subheading */}
              <div className="mb-4 p-3 bg-white/[0.04] rounded-xl border border-white/5">
                <h3 className="font-semibold text-white text-sm mb-1">
                  {meetingHeading}
                </h3>
                {meetingSubheading && (
                  <p className="text-xs text-white/70">
                    {meetingSubheading}
                  </p>
                )}
              </div>

              {meetingCode && (
                <div className="mb-3">
                  <label className="text-xs font-medium text-neutral-400 mb-1 block">
                    Meeting Code
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl">
                      <p className="text-base font-bold tracking-widest text-center text-cyan-300 uppercase">
                        {formatMeetingCode(meetingCode)}
                      </p>
                    </div>
                    <button
                      onClick={copyMeetingCode}
                      className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                      title="Copy Meeting Code"
                    >
                      <Copy size={16} className="text-neutral-300 hover:text-white" />
                    </button>
                  </div>
                </div>
              )}

              {meetingLink && (
                <div>
                  <label className="text-xs font-medium text-neutral-400 mb-1 block">
                    Meeting Link
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl">
                      <p className="text-xs text-neutral-300 truncate">
                        {meetingLink}
                      </p>
                    </div>
                    <button
                      onClick={copyMeetingLink}
                      className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                      title="Copy Meeting Link"
                    >
                      <Copy size={16} className="text-neutral-300 hover:text-white" />
                    </button>
                  </div>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Main Video Stage with responsive padding when dock is open */}
      <div
        className={cn(
          "relative flex size-full items-center justify-center transition-all duration-300 ease-in-out",
          isDockOpen && "xl:pr-[420px]"
        )}
      >
        <div
          className={cn(
            "flex size-full items-center justify-center transition-all duration-300",
            isDockOpen ? "max-w-[calc(100%-420px)]" : "max-w-[1200px]"
          )}
          style={{ minWidth: "320px" }}
        >
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ minWidth: "320px", width: "100%" }}
          >
            <CallLayout />
          </div>
        </div>
      </div>

      {/* Unified In-Meeting Sliding Side Dock */}
      <MeetingSideDock
        isOpen={isDockOpen}
        activeTab={activeDockTab}
        onTabChange={(tab) => setActiveDockTab(tab)}
        onClose={() => setIsDockOpen(false)}
        participantCount={totalParticipantsCount}
        unreadCount={messages.length}
      >
        {activeDockTab === "chat" && (
          <MeetingChat embedded onClose={() => setIsDockOpen(false)} />
        )}
        {activeDockTab === "participants" && (
          <CustomParticipantsList embedded onClose={() => setIsDockOpen(false)} />
        )}
        {activeDockTab === "ai" && (
          <Chatbot embedded onClose={() => setIsDockOpen(false)} />
        )}
        {activeDockTab === "github" && (
          <GithubRepoImporter embedded onClose={() => setIsDockOpen(false)} />
        )}
      </MeetingSideDock>

      {/* Fullscreen Whiteboard Overlay */}
      {showWhiteboard && (
        <Whiteboard onClose={() => setShowWhiteboard(false)} />
      )}

      {/* Bottom Control Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 pb-4 pt-2 flex items-center justify-center pointer-events-none">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 pointer-events-auto px-4 py-2.5 rounded-2xl bg-[#040e1c]/90 backdrop-blur-xl border border-[rgba(0,180,255,0.18)] shadow-[0_8px_32px_rgba(0,0,0,0.65)]">
          <CallControls onLeave={() => navigate(`/`)} />

          <DropdownMenu>
            <div className="flex items-center">
              <DropdownMenuTrigger className="cursor-pointer rounded-xl bg-[#102033] px-3.5 py-2 hover:bg-[#172c47] text-neutral-300 hover:text-white transition-colors border border-white/5">
                <LayoutList size={18} />
              </DropdownMenuTrigger>
            </div>
            <DropdownMenuContent className="border-[rgba(0,180,255,0.2)] bg-[#040e1c] text-white">
              {["Grid", "Speaker-Left", "Speaker-Right"].map((item, index) => (
                <div key={index}>
                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-cyan-500/20 text-xs"
                    onClick={() =>
                      setLayout(item.toLowerCase() as CallLayoutType)
                    }
                  >
                    {item}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="border-white/10" />
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <CallStatsButton />

          {/* Whiteboard Button */}
          <button
            onClick={() => setShowWhiteboard((prev) => !prev)}
            className={cn(
              "cursor-pointer rounded-xl p-2.5 sm:px-3 sm:py-2 transition-all flex items-center gap-1.5 border",
              showWhiteboard
                ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-cyan-400 shadow-[0_0_12px_rgba(0,180,255,0.35)]"
                : "bg-[#102033] text-neutral-300 hover:text-white hover:bg-[#172c47] border-white/5"
            )}
            title="Toggle Whiteboard"
          >
            <Edit size={18} />
            <span className="hidden lg:inline text-xs font-medium">Whiteboard</span>
          </button>

          {/* ✋ Raise Hand Button */}
          <button
            onClick={toggleHandRaise}
            className={cn(
              "cursor-pointer rounded-xl p-2.5 sm:px-3 sm:py-2 transition-all flex items-center gap-1.5 border",
              isHandRaised
                ? "bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_16px_rgba(245,158,11,0.5)] animate-pulse"
                : "bg-[#102033] text-neutral-300 hover:text-white hover:bg-[#172c47] border-white/5"
            )}
            title={
              isHandRaised
                ? "Lower your hand"
                : "Raise your hand to ask a question"
            }
          >
            <span className="text-base leading-none">✋</span>
            <span className="hidden lg:inline text-xs font-medium">
              {isHandRaised ? "Hand Raised" : "Raise Hand"}
            </span>
          </button>

          {/* Chat Button */}
          <button
            onClick={() => handleToggleDock("chat")}
            className={cn(
              "relative cursor-pointer rounded-xl p-2.5 sm:px-3 sm:py-2 transition-all flex items-center gap-1.5 border",
              isDockOpen && activeDockTab === "chat"
                ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-cyan-400 shadow-[0_0_12px_rgba(0,180,255,0.35)]"
                : "bg-[#102033] text-neutral-300 hover:text-white hover:bg-[#172c47] border-white/5"
            )}
            title="Toggle Chat"
          >
            <MessageSquare size={18} />
            <span className="hidden lg:inline text-xs font-medium">Chat</span>
            {messages.length > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-400 text-[#020b16] px-1 text-[10px] font-bold">
                {messages.length}
              </span>
            )}
          </button>

          {/* Participants Button */}
          <button
            onClick={() => handleToggleDock("participants")}
            className={cn(
              "relative cursor-pointer rounded-xl p-2.5 sm:px-3 sm:py-2 transition-all flex items-center gap-1.5 border",
              isDockOpen && activeDockTab === "participants"
                ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-cyan-400 shadow-[0_0_12px_rgba(0,180,255,0.35)]"
                : "bg-[#102033] text-neutral-300 hover:text-white hover:bg-[#172c47] border-white/5"
            )}
            title="Toggle Participants"
          >
            <Users size={18} />
            <span className="hidden lg:inline text-xs font-medium">People</span>
            {raisedHands.size > 0 ? (
              <span
                className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 text-black px-1.5 text-[10px] font-extrabold animate-pulse"
                title={`${raisedHands.size} hand(s) raised`}
              >
                ✋ {raisedHands.size}
              </span>
            ) : totalParticipantsCount > 0 ? (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1 text-[10px] font-bold">
                {totalParticipantsCount}
              </span>
            ) : null}
          </button>

          {/* AI Assistant Button */}
          <button
            onClick={() => handleToggleDock("ai")}
            className={cn(
              "cursor-pointer rounded-xl p-2.5 sm:px-3 sm:py-2 transition-all flex items-center gap-1.5 border",
              isDockOpen && activeDockTab === "ai"
                ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-cyan-400 shadow-[0_0_12px_rgba(0,180,255,0.35)]"
                : "bg-[#102033] text-neutral-300 hover:text-white hover:bg-[#172c47] border-white/5"
            )}
            title="AI Study Assistant"
          >
            <Bot size={18} />
            <span className="hidden lg:inline text-xs font-medium">AI Tutor</span>
          </button>

          {/* GitHub Code Explorer Button */}
          <button
            onClick={() => handleToggleDock("github")}
            className={cn(
              "cursor-pointer rounded-xl p-2.5 sm:px-3 sm:py-2 transition-all flex items-center gap-1.5 border",
              isDockOpen && activeDockTab === "github"
                ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-cyan-400 shadow-[0_0_12px_rgba(0,180,255,0.35)]"
                : "bg-[#102033] text-neutral-300 hover:text-white hover:bg-[#172c47] border-white/5"
            )}
            title="GitHub Repository Code"
          >
            <Github size={18} />
            <span className="hidden lg:inline text-xs font-medium">Code</span>
          </button>

          {!isPersonalRoom && <EndCallButton />}
        </div>
      </div>
    </section>
  );
};

const MeetingRoom = () => {
  return (
    <ClassroomProvider>
      <MeetingRoomContent />
    </ClassroomProvider>
  );
};

export default MeetingRoom;
