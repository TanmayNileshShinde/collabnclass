import { useCall, useCallStateHooks } from "@stream-io/video-react-sdk";
import { useNavigate } from "react-router-dom";
import { PhoneOff } from "lucide-react";

const EndCallButton = () => {
  const call = useCall();
  const navigate = useNavigate();

  if (!call) {
    throw new Error(
      "useStreamCall must be used within a StreamCall component."
    );
  }

  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();

  const isMeetingOwner =
    localParticipant &&
    call.state.createdBy &&
    localParticipant.userId === call.state.createdBy.id;

  if (!isMeetingOwner) return null;

  const endCall = async () => {
    try {
      await call.sendCustomEvent({
        type: "meeting-ended-by-host",
        endedAt: new Date().toISOString(),
        endedBy: localParticipant?.name || "Classroom Host",
      });
    } catch (e) {
      console.warn("Failed to broadcast end-call event:", e);
    }
    await call.endCall();
    navigate("/");
  };

  return (
    <button
      onClick={endCall}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/60 hover:border-rose-400 text-rose-200 transition-all shadow-[0_0_14px_rgba(244,63,94,0.3)] whitespace-nowrap active:scale-95 cursor-pointer"
      title="End classroom session for all participants"
    >
      <PhoneOff size={15} className="text-rose-400" />
      <span className="hidden sm:inline">End for All</span>
    </button>
  );
};

export default EndCallButton;
