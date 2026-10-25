import { useState } from "react";
import { avatarImages } from "@/constants";
import { useToast } from "./ui/use-toast";
import { Users, Copy, Play, Trash2, Radio, Clock, Check, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMeetingCode } from "@/lib/meetingUtils";

interface MeetingCardProps {
  title: string;
  date: string;
  icon: string;
  isPreviousMeeting?: boolean;
  isLive?: boolean;
  buttonIcon1?: string;
  buttonText?: string;
  handleClick: () => void;
  link: string;
  onDelete?: () => void;
  showDeleteButton?: boolean;
  showAttendees?: boolean;
  meetingId?: string;
  onViewAttendance?: (meetingId: string, meetingTitle: string) => void;
}

const MeetingCard = ({
  icon,
  title,
  date,
  isPreviousMeeting,
  isLive = false,
  buttonIcon1,
  handleClick,
  link,
  buttonText,
  onDelete,
  showDeleteButton,
  showAttendees = true,
  meetingId,
  onViewAttendance,
}: MeetingCardProps) => {
  const { toast } = useToast();
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isCopiedCode, setIsCopiedCode] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    setIsCopiedLink(true);
    toast({ title: "Classroom Link Copied", description: "Meeting URL ready to share." });
    setTimeout(() => setIsCopiedLink(false), 2200);
  };

  const copyCode = () => {
    if (!meetingId) return;
    navigator.clipboard.writeText(meetingId);
    setIsCopiedCode(true);
    toast({ title: "Meeting Code Copied", description: meetingId });
    setTimeout(() => setIsCopiedCode(false), 2200);
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-3xl p-5 sm:p-6 transition-all duration-300 ease-out overflow-hidden border",
        "backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.18)] hover:-translate-y-1.5",
        isLive
          ? "dark:bg-gradient-to-b dark:from-[#130713]/90 dark:to-[#080209]/90 bg-rose-50/70 border-rose-500/40 hover:border-rose-400/70 shadow-[0_0_24px_rgba(244,63,94,0.18)] hover:shadow-[0_0_36px_rgba(244,63,94,0.3)]"
          : "dark:bg-[#040e1c]/85 bg-white/90 dark:border-[rgba(0,180,255,0.16)] border-sky-200/80 hover:dark:border-[rgba(0,229,255,0.4)] hover:border-sky-400 hover:shadow-[0_12px_40px_rgba(0,180,255,0.18)]"
      )}
    >
      {/* Top Ambient Glow Line */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-[2px] pointer-events-none transition-opacity duration-300",
          isLive
            ? "bg-gradient-to-r from-transparent via-rose-500 to-transparent"
            : "bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-70 group-hover:opacity-100"
        )}
      />

      {/* Top Ambient Glow Orb */}
      <div
        className={cn(
          "absolute -top-16 -right-16 w-36 h-36 rounded-full pointer-events-none blur-2xl transition-opacity duration-300",
          isLive ? "bg-rose-500/15" : "bg-cyan-500/10 group-hover:bg-cyan-500/20"
        )}
      />

      {/* Card Header & Content */}
      <div className="relative z-10 flex flex-col gap-4">
        {/* Top Header Row: Icon + Status Pill */}
        <div className="flex items-center justify-between gap-3">
          <div
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-105",
              isLive
                ? "bg-rose-500/15 border-rose-500/35 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.25)]"
                : "dark:bg-cyan-500/10 bg-sky-50 dark:border-cyan-500/25 border-sky-300 dark:text-cyan-300 text-sky-600 shadow-[0_0_14px_rgba(0,180,255,0.15)]"
            )}
          >
            {isLive ? (
              <Radio className="w-5 h-5 text-rose-400 animate-pulse" />
            ) : buttonIcon1 ? (
              <img src={buttonIcon1} alt="Icon" width={22} height={22} className="object-contain" />
            ) : icon ? (
              <img src={icon} alt="Icon" width={22} height={22} className="object-contain" />
            ) : (
              <Calendar className="w-5 h-5 dark:text-cyan-400 text-sky-600" />
            )}
          </div>

          {/* Dynamic Status Badges */}
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-rose-500/15 border border-rose-500/50 text-rose-400 shadow-[0_0_14px_rgba(244,63,94,0.3)] animate-pulse">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
              <span>LIVE NOW</span>
            </span>
          ) : isPreviousMeeting ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium uppercase tracking-wider dark:bg-white/5 bg-slate-100 border dark:border-white/10 border-slate-200 text-neutral-400">
              Concluded
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider dark:bg-cyan-500/10 bg-sky-50 border dark:border-cyan-500/30 border-sky-200 dark:text-cyan-300 text-sky-700 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>Scheduled</span>
            </span>
          )}
        </div>

        {/* Title, Date, Code */}
        <div>
          <h2 className="text-lg sm:text-xl font-bold font-syne tracking-tight dark:text-white text-slate-900 line-clamp-1 group-hover:text-cyan-400 dark:group-hover:text-cyan-300 transition-colors">
            {title}
          </h2>

          <div className="flex items-center gap-1.5 text-xs font-medium dark:text-neutral-400 text-slate-500 mt-2">
            <Clock className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            <span className="truncate">{date}</span>
          </div>

          {meetingId && (
            <button
              onClick={copyCode}
              className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono dark:bg-white/[0.04] bg-slate-100 border dark:border-white/10 border-slate-200 hover:border-cyan-400 text-neutral-300 dark:text-neutral-300 text-slate-600 hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors shadow-sm"
              title="Click to copy meeting code"
            >
              <span className="text-[10px] uppercase font-bold text-neutral-400">CODE:</span>
              <span className="font-semibold tracking-wider text-cyan-600 dark:text-cyan-300">
                {formatMeetingCode(meetingId)}
              </span>
              {isCopiedCode ? (
                <Check size={12} className="text-emerald-400 shrink-0" />
              ) : (
                <Copy size={12} className="text-neutral-400 shrink-0" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="relative z-10 w-full h-px dark:bg-white/5 bg-slate-200/80 my-4" />

      {/* Card Footer: Attendees + Action Buttons */}
      <div className="relative z-10 flex flex-col gap-3">
        {showAttendees && (
          <div className="flex items-center gap-2">
            <div className="flex items-center -space-x-2 overflow-hidden">
              {avatarImages.slice(0, 4).map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt="Attendee"
                  className="inline-block h-7 w-7 rounded-full border-2 dark:border-[#040e1c] border-white ring-1 ring-cyan-500/30 object-cover hover:translate-y-[-2px] hover:scale-110 transition-transform"
                />
              ))}
              {avatarImages.length > 4 && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full dark:bg-[#07162b] bg-slate-200 border-2 dark:border-[#040e1c] border-white text-[10px] font-bold dark:text-cyan-300 text-slate-700">
                  +{avatarImages.length - 4}
                </div>
              )}
            </div>
            <span className="text-[11px] font-medium dark:text-neutral-400 text-slate-500">
              Classroom Attendees
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1 flex-wrap">
          {/* Primary Action Button */}
          <button
            onClick={handleClick}
            className={cn(
              "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white transition-all shadow-md active:scale-95",
              isLive
                ? "bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:shadow-[0_0_28px_rgba(244,63,94,0.6)] hover:brightness-110"
                : "bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 shadow-[0_0_16px_rgba(0,180,255,0.3)] hover:shadow-[0_0_24px_rgba(0,180,255,0.5)] hover:brightness-110"
            )}
          >
            {isLive ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                <span>Join Live Class</span>
              </>
            ) : (
              <>
                {buttonIcon1 ? (
                  <img src={buttonIcon1} alt="" width={14} height={14} />
                ) : (
                  <Play size={13} fill="currentColor" />
                )}
                <span>{buttonText || "Start Class"}</span>
              </>
            )}
          </button>

          {/* Copy Link Button */}
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium dark:bg-white/[0.04] bg-slate-100 hover:bg-slate-200/80 dark:hover:bg-white/10 border dark:border-white/10 border-slate-200/80 dark:text-neutral-300 text-slate-700 transition-all active:scale-95"
            title="Copy invitation link"
          >
            {isCopiedLink ? (
              <>
                <Check size={13} className="text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy Link</span>
              </>
            )}
          </button>

          {/* Attendance Modal Trigger (Previous Meetings) */}
          {isPreviousMeeting && meetingId && onViewAttendance && (
            <button
              onClick={() => onViewAttendance(meetingId, title)}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium dark:bg-emerald-500/10 bg-emerald-50 border dark:border-emerald-500/30 border-emerald-200 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/20 transition-all"
            >
              <Users size={13} />
              <span>Attendance</span>
            </button>
          )}

          {/* Delete Button (Recordings) */}
          {showDeleteButton && onDelete && (
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium dark:bg-rose-500/10 bg-rose-50 border dark:border-rose-500/30 border-rose-200 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all ml-auto"
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingCard;
