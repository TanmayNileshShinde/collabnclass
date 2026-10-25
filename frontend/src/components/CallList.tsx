import { Call, CallRecording } from "@stream-io/video-react-sdk";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";

import Loader from "./Loader";
import { useGetCalls } from "@/hooks/useGetCalls";
import MeetingCard from "./MeetingCard";
import { useToast } from "./ui/use-toast";
import AttendanceModal from "./AttendanceModal";
import { Radio, Calendar, Sparkles, CalendarX, Plus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export type UpcomingFilterType = "all" | "live" | "scheduled";

interface CallListProps {
  type: "ended" | "upcoming" | "recordings";
  searchQuery?: string;
  activeFilter?: UpcomingFilterType;
  onFilterChange?: (filter: UpcomingFilterType) => void;
  hideFilterHeader?: boolean;
}

const CallList = ({
  type,
  searchQuery = "",
  activeFilter,
  onFilterChange,
  hideFilterHeader = false,
}: CallListProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getToken } = useAuth();
  const { liveCalls, upcomingCalls, endedCalls, callRecordings, isLoading } =
    useGetCalls();

  const [recordings, setRecordings] = useState<CallRecording[]>([]);
  const [internalFilter, setInternalFilter] = useState<UpcomingFilterType>("all");
  const [attendanceModal, setAttendanceModal] = useState<{
    isOpen: boolean;
    meetingId: string;
    meetingTitle: string;
  }>({
    isOpen: false,
    meetingId: "",
    meetingTitle: "",
  });

  const currentFilter = activeFilter ?? internalFilter;
  const setFilter = onFilterChange ?? setInternalFilter;

  const handleViewAttendance = (meetingId: string, meetingTitle: string) => {
    setAttendanceModal({
      isOpen: true,
      meetingId,
      meetingTitle,
    });
  };

  const rawCalls = useMemo(() => {
    switch (type) {
      case "ended":
        return endedCalls;
      case "recordings":
        return recordings;
      case "upcoming": {
        if (currentFilter === "live") return liveCalls;
        if (currentFilter === "scheduled") return upcomingCalls;
        // All: Live calls first, followed by scheduled
        return [...liveCalls, ...upcomingCalls];
      }
      default:
        return [];
    }
  }, [type, endedCalls, recordings, currentFilter, liveCalls, upcomingCalls]);

  // Apply search query filter
  const calls = useMemo(() => {
    if (!searchQuery.trim()) return rawCalls;
    const q = searchQuery.toLowerCase().trim();
    return rawCalls.filter((meeting: Call | CallRecording) => {
      const isCall = !("filename" in meeting);
      if (isCall) {
        const c = meeting as Call;
        const title = c.state?.custom?.heading || c.state?.custom?.description || "";
        const id = c.id || "";
        const code = c.state?.custom?.meetingCode || "";
        return (
          title.toLowerCase().includes(q) ||
          id.toLowerCase().includes(q) ||
          code.toLowerCase().includes(q)
        );
      } else {
        const r = meeting as CallRecording;
        return (r.filename || "").toLowerCase().includes(q);
      }
    });
  }, [rawCalls, searchQuery]);

  const handleDeleteRecording = async (recording: CallRecording) => {
    try {
      const confirmed = window.confirm(
        "Are you sure you want to delete this recording? This action cannot be undone."
      );
      if (!confirmed) return;

      const recordingId = recording.filename || recording.url;
      const token = await getToken();

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${import.meta.env.VITE_BE_URL || ""}/api/stream/recordings/${encodeURIComponent(
          recordingId
        )}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete recording");
      }

      setRecordings((prev) =>
        prev.filter(
          (r) => r.filename !== recording.filename && r.url !== recording.url
        )
      );

      toast({
        title: "Recording deleted",
        description: "The recording has been permanently removed.",
      });
    } catch (error) {
      console.error("Error deleting recording:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete recording. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchRecordings = async () => {
      const callData = await Promise.all(
        callRecordings?.map((meeting) => meeting.queryRecordings()) ?? []
      );

      const recs = callData
        .filter((call) => call.recordings.length > 0)
        .flatMap((call) => call.recordings);

      setRecordings(recs);
    };

    if (type === "recordings") {
      fetchRecordings();
    }
  }, [type, callRecordings]);

  if (isLoading) return <Loader />;

  const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin;
  const totalUpcomingCount = (liveCalls?.length ?? 0) + (upcomingCalls?.length ?? 0);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Dynamic Filter Tabs (rendered when not hidden by parent) */}
      {!hideFilterHeader && type === "upcoming" && totalUpcomingCount > 0 && (
        <div className="flex items-center gap-2 p-1.5 rounded-2xl dark:bg-[#040e1c]/80 bg-white/80 backdrop-blur-xl border dark:border-[rgba(0,180,255,0.18)] border-sky-200/80 max-w-fit shadow-lg">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all",
              currentFilter === "all"
                ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md border border-cyan-400/40"
                : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>All ({totalUpcomingCount})</span>
          </button>

          <button
            onClick={() => setFilter("live")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all",
              currentFilter === "live"
                ? "bg-rose-500/25 text-rose-200 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.35)]"
                : "text-neutral-400 hover:text-rose-300 hover:bg-rose-500/10"
            )}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
            <span>Live Now ({liveCalls.length})</span>
          </button>

          <button
            onClick={() => setFilter("scheduled")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all",
              currentFilter === "scheduled"
                ? "bg-cyan-500/25 text-cyan-200 border border-cyan-500/50 shadow-[0_0_15px_rgba(0,220,255,0.25)]"
                : "text-neutral-400 hover:text-cyan-300 hover:bg-cyan-500/10"
            )}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Scheduled ({upcomingCalls.length})</span>
          </button>
        </div>
      )}

      {/* Grid of Meeting Cards */}
      <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {calls && calls.length > 0 ? (
          calls.map((meeting: Call | CallRecording) => {
            const isCall = !("filename" in meeting);
            const isLive =
              isCall &&
              liveCalls.some((c) => c.id === (meeting as Call).id);

            return (
              <MeetingCard
                key={
                  (meeting as Call).id ||
                  (meeting as CallRecording).filename ||
                  (meeting as CallRecording).url
                }
                icon={
                  type === "ended"
                    ? "/icons/previous.svg"
                    : isLive
                    ? "/icons/upcoming.svg"
                    : type === "upcoming"
                    ? "/icons/upcoming.svg"
                    : "/icons/recordings.svg"
                }
                isLive={isLive}
                title={
                  (meeting as Call).state?.custom?.heading ||
                  (meeting as Call).state?.custom?.description ||
                  (meeting as CallRecording).filename?.substring(0, 24) ||
                  "Class Meeting"
                }
                date={
                  !isCall
                    ? (meeting as CallRecording).start_time
                      ? new Date((meeting as CallRecording).start_time).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "Date not set"
                    : (meeting as Call).state?.startsAt
                    ? (meeting as Call).state.startsAt!.toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "Date not set"
                }
                isPreviousMeeting={type === "ended"}
                link={
                  type === "recordings"
                    ? (meeting as CallRecording).url
                    : `${baseUrl}/meeting/${(meeting as Call).id}`
                }
                buttonIcon1={type === "recordings" ? "/icons/play.svg" : undefined}
                buttonText={
                  type === "recordings"
                    ? "Play"
                    : isLive
                    ? "Join Live Class"
                    : "Start Class"
                }
                handleClick={
                  type === "recordings"
                    ? () => window.open((meeting as CallRecording).url, "_blank")
                    : () => navigate(`/meeting/${(meeting as Call).id}`)
                }
                showDeleteButton={type === "recordings"}
                showAttendees={type !== "recordings"}
                meetingId={(meeting as Call)?.id}
                onViewAttendance={type === "ended" ? handleViewAttendance : undefined}
                onDelete={() =>
                  type === "recordings"
                    ? handleDeleteRecording(meeting as CallRecording)
                    : undefined
                }
              />
            );
          })
        ) : (
          /* High-End Cyberpunk Empty State */
          <div className="col-span-full flex flex-col items-center justify-center p-10 sm:p-14 rounded-3xl dark:bg-[#040e1c]/80 bg-white/80 backdrop-blur-xl border dark:border-[rgba(0,180,255,0.18)] border-sky-200/80 text-center shadow-lg relative overflow-hidden">
            {/* Ambient background glow */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(0, 180, 255, 0.08) 0%, transparent 70%)",
              }}
            />

            <div className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center dark:bg-cyan-500/10 bg-sky-50 border dark:border-cyan-500/30 border-sky-300 text-cyan-400 mb-4 shadow-[0_0_20px_rgba(0,180,255,0.2)]">
              {searchQuery ? (
                <CalendarX className="w-8 h-8 text-cyan-400" />
              ) : currentFilter === "live" ? (
                <Radio className="w-8 h-8 text-rose-400 animate-pulse" />
              ) : (
                <Calendar className="w-8 h-8 text-cyan-400" />
              )}
            </div>

            <h3 className="relative z-10 text-xl font-bold font-syne dark:text-white text-slate-900 mb-1.5">
              {searchQuery
                ? "No Classrooms Found"
                : currentFilter === "live"
                ? "No Live Classrooms Active Right Now"
                : type === "upcoming"
                ? "No Upcoming Classrooms Scheduled"
                : type === "recordings"
                ? "No Session Recordings Available"
                : "No Previous Calls"}
            </h3>

            <p className="relative z-10 text-sm dark:text-neutral-400 text-slate-500 max-w-md mb-6 leading-relaxed">
              {searchQuery
                ? `No sessions match "${searchQuery}". Check the meeting title, code, or reset your search.`
                : currentFilter === "live"
                ? "There are currently no active peer video streams. Scheduled sessions will automatically show the live badge when launched."
                : type === "upcoming"
                ? "You're all caught up! Create an instant classroom session or schedule an upcoming lecture from the command dashboard."
                : "Completed meeting sessions and attendance histories will appear here."}
            </p>

            <div className="relative z-10 flex items-center gap-3 flex-wrap justify-center">
              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 shadow-[0_0_20px_rgba(0,180,255,0.35)] hover:shadow-[0_0_28px_rgba(0,180,255,0.5)] active:scale-95 transition-all"
              >
                <Plus size={15} />
                <span>Go to Dashboard & Schedule</span>
              </button>

              {searchQuery && (
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium dark:bg-white/[0.04] bg-slate-100 hover:bg-slate-200 dark:hover:bg-white/10 border dark:border-white/10 border-slate-200 dark:text-neutral-300 text-slate-700 transition-all"
                >
                  <RefreshCw size={13} />
                  <span>Reset Search</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Attendance Modal */}
        {type === "ended" && (
          <AttendanceModal
            isOpen={attendanceModal.isOpen}
            onClose={() => setAttendanceModal((prev) => ({ ...prev, isOpen: false }))}
            meetingId={attendanceModal.meetingId}
            meetingTitle={attendanceModal.meetingTitle}
          />
        )}
      </div>
    </div>
  );
};

export default CallList;
