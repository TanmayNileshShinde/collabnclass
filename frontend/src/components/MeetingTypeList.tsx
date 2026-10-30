import { useState } from "react";
import { useNavigate } from "react-router-dom";

import HomeCard from "./HomeCard";
import MeetingModal from "./MeetingModal";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useUser } from "@clerk/clerk-react";
import Loader from "./Loader";
import { Textarea } from "./ui/textarea";
import ReactDatePicker from "react-datepicker";
import { useToast } from "./ui/use-toast";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { generateMeetingCode } from "@/lib/meetingUtils";
import "react-datepicker/dist/react-datepicker.css";

const initialValues = {
  dateTime: new Date(),
  description: "",
  heading: "",
  subheading: "",
  link: "",
  meetingCode: "",
};

// Ocean Cyberpunk input/textarea classes
const oceanInput =
  "dark:border dark:border-[rgba(0,180,255,0.2)] border border-slate-300 dark:bg-[rgba(2,8,19,0.7)] bg-white dark:text-[rgba(240,249,255,0.95)] text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-0 transition-all duration-300 rounded-xl backdrop-blur-md";

const oceanLabel = "text-sm font-semibold tracking-wide dark:text-cyan-200 text-slate-700 transition-colors duration-300";

interface MeetingTypeListProps {
  onJoinClick?: () => void;
  onScheduleClick?: () => void;
}

const MeetingTypeList = ({}: MeetingTypeListProps = {}) => {
  const navigate = useNavigate();
  const [meetingState, setMeetingState] = useState<
    "isScheduleMeeting" | "isJoiningMeeting" | "isInstantMeeting" | undefined
  >(undefined);
  const [values, setValues] = useState(initialValues);
  const [callDetail, setCallDetail] = useState<Call>();
  const client = useStreamVideoClient();
  const { user } = useUser();
  const { toast } = useToast();

  const resetForm = () => {
    setValues(initialValues);
    setMeetingState(undefined);
  };

  const joinMeetingByCodeOrLink = async (rawInput: string) => {
    if (!client) return;
    try {
      const trimmed = rawInput.trim();
      if (!trimmed) {
        toast({ title: "Please enter a meeting code or link" });
        return;
      }

      // 1. Check if user pasted a full meeting link (e.g. .../meeting/:id)
      const urlMatch = trimmed.match(/\/meeting\/([a-zA-Z0-9_\-]+)/);
      if (urlMatch && urlMatch[1]) {
        navigate(`/meeting/${urlMatch[1]}`);
        toast({ title: "Joining classroom..." });
        return;
      }

      // 2. Check if user pasted a standard UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(trimmed)) {
        navigate(`/meeting/${trimmed}`);
        toast({ title: "Joining classroom..." });
        return;
      }

      // 3. Otherwise treat as 8-character meeting code
      const normalizedCode = trimmed.replace(/[^A-Z0-9]/gi, "").toUpperCase();
      if (normalizedCode.length !== 8) {
        toast({
          title: "Invalid meeting code or link",
          description: "Meeting code must be 8 characters, or paste a valid meeting URL.",
          variant: "destructive",
        });
        return;
      }

      const { calls } = await client.queryCalls({
        filter_conditions: { "custom.meetingCode": normalizedCode },
        limit: 1,
      });

      if (calls.length === 0) {
        toast({
          title: "Meeting not found",
          description: "No active meeting found with this code",
          variant: "destructive",
        });
        return;
      }

      const call = calls[0];
      if (call.state.endedAt) {
        toast({
          title: "Meeting has ended",
          description: "This meeting has already concluded",
          variant: "destructive",
        });
        return;
      }

      navigate(`/meeting/${call.id}`);
      toast({ title: "Connecting to classroom..." });
    } catch (error) {
      console.error("Error joining meeting by code/link:", error);
      toast({
        title: "Failed to join meeting",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const createMeeting = async () => {
    if (!client || !user) return;
    const isInstantMeeting = meetingState === "isInstantMeeting";
    const isScheduledMeeting = meetingState === "isScheduleMeeting";
    try {
      if (isScheduledMeeting && (!values.dateTime || !values.dateTime.getTime)) {
        toast({ title: "Please select a date and time" });
        return;
      }
      const generateSafeId = () => {
        if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
          return crypto.randomUUID();
        }
        return `room-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      };
      const id = generateSafeId();
      const call = client.call("default", id);
      if (!call) throw new Error("Failed to create call object");
      const startsAt = isInstantMeeting ? new Date().toISOString() : values.dateTime.toISOString();
      const description = values.description || (isInstantMeeting ? "Instant Meeting" : "Scheduled Meeting");
      const heading = values.heading || (isInstantMeeting ? "Instant Meeting" : "Scheduled Meeting");
      const subheading = values.subheading || "";
      const meetingCode = generateMeetingCode();
      await call.getOrCreate({
        data: {
          starts_at: startsAt,
          custom: { description, heading, subheading, meetingCode },
        },
      });
      if (isInstantMeeting) {
        navigate(`/meeting/${call.id}`);
        toast({ title: "Instant Classroom Started" });
        return;
      }
      if (isScheduledMeeting) {
        setCallDetail(call);
        toast({ title: "Classroom Scheduled Successfully" });
      }
    } catch (error) {
      console.error("Error creating meeting:", error);
      toast({
        title: "Failed to create Meeting",
        description: error instanceof Error ? error.message : "Failed to create meeting",
        variant: "destructive",
      });
    }
  };

  if (!client || !user) return <Loader />;

  const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin;
  const meetingLink = `${baseUrl}/meeting/${callDetail?.id}`;
  const meetingCode = callDetail?.state.custom?.meetingCode || "";

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      <HomeCard
        img="/icons/add-meeting.svg"
        title="New Meeting"
        description="Launch an instant live classroom with HD video, screen sharing & AI"
        badge="Instant Live"
        accent="cyan"
        className="dark:bg-gradient-to-br dark:from-[#02182b] dark:via-[#042442] dark:to-[#011425] bg-gradient-to-br from-white via-cyan-50/50 to-sky-50/80 shadow-sm dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.45)]"
        handleClick={() => setMeetingState("isInstantMeeting")}
      />
      <HomeCard
        img="/icons/join-meeting.svg"
        title="Join Meeting"
        description="Connect to an existing classroom via 8-digit code or meeting URL"
        badge="Quick Code"
        accent="blue"
        className="dark:bg-gradient-to-br dark:from-[#03152e] dark:via-[#062047] dark:to-[#021024] bg-gradient-to-br from-white via-sky-50/50 to-blue-50/80 shadow-sm dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.45)]"
        handleClick={() => setMeetingState("isJoiningMeeting")}
      />
      <HomeCard
        img="/icons/schedule.svg"
        title="Schedule Lecture"
        description="Plan lectures, configure agendas, and sync class calendars"
        badge="Calendar"
        accent="amber"
        className="dark:bg-gradient-to-br dark:from-[#1c1503] dark:via-[#2d2106] dark:to-[#120d01] bg-gradient-to-br from-white via-amber-50/50 to-orange-50/80 shadow-sm dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.45)]"
        handleClick={() => setMeetingState("isScheduleMeeting")}
      />
      <HomeCard
        img="/icons/recordings.svg"
        title="Class Archives"
        description="Access past recordings, attendance analytics, and lecture notes"
        badge="Vault"
        accent="purple"
        className="dark:bg-gradient-to-br dark:from-[#160829] dark:via-[#240e3f] dark:to-[#0e041a] bg-gradient-to-br from-white via-purple-50/50 to-indigo-50/80 shadow-sm dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.45)]"
        handleClick={() => navigate("/recordings")}
      />

      {!callDetail ? (
        <MeetingModal
          isOpen={meetingState === "isScheduleMeeting"}
          onClose={resetForm}
          title="Schedule Classroom Session"
          handleClick={createMeeting}
        >
          <div className="flex flex-col gap-3">
            <label className={oceanLabel}>Lecture Heading</label>
            <Input
              className={oceanInput}
              placeholder="e.g. CS101: Distributed Systems & Consensus"
              value={values.heading}
              onChange={(e) => setValues({ ...values, heading: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-3">
            <label className={oceanLabel}>Subheading / Module</label>
            <Input
              className={oceanInput}
              placeholder="e.g. Week 4: Raft Consensus Algorithm"
              value={values.subheading}
              onChange={(e) => setValues({ ...values, subheading: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-3">
            <label className={oceanLabel}>Lesson Agenda / Description</label>
            <Textarea
              className={oceanInput}
              placeholder="Outline topics covered, prerequisites, or required readings..."
              onChange={(e) => setValues({ ...values, description: e.target.value })}
            />
          </div>
          <div className="flex w-full flex-col gap-3">
            <label className={oceanLabel}>Schedule Date & Time</label>
            <ReactDatePicker
              selected={values.dateTime}
              onChange={(date) => setValues({ ...values, dateTime: date! })}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              timeCaption="time"
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full rounded-xl border border-[rgba(0,180,255,0.2)] bg-[rgba(2,8,19,0.7)] text-[rgba(240,249,255,0.95)] placeholder:text-[rgba(100,180,220,0.4)] p-3 focus:outline-none focus:ring-2 focus:ring-[rgba(0,229,255,0.4)] transition-all duration-200 backdrop-blur-md"
            />
          </div>
        </MeetingModal>
      ) : (
        <MeetingModal
          isOpen={meetingState === "isScheduleMeeting"}
          onClose={() => { setMeetingState(undefined); setCallDetail(undefined); }}
          title="Classroom Scheduled"
          handleClick={() => { navigator.clipboard.writeText(meetingLink); toast({ title: "Class Link Copied!" }); }}
          image={"/icons/checked.svg"}
          buttonIcon="/icons/copy.svg"
          className="text-center"
          buttonText="Copy Classroom Link"
        >
          <div className="flex flex-col gap-4">
            {meetingCode && (
              <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold text-cyan-200">Classroom Code</label>
                <div className="flex items-center gap-3">
                  <div
                    className="flex-1 px-4 py-4 rounded-xl"
                    style={{
                      background: "rgba(2,8,19,0.85)",
                      border: "1px solid rgba(0,229,255,0.3)",
                      boxShadow: "0 0 25px rgba(0,229,255,0.15), inset 0 1px 0 rgba(0,229,255,0.1)",
                    }}
                  >
                    <p
                      className="text-2xl font-mono font-extrabold tracking-widest text-center uppercase text-cyan-300 drop-shadow-[0_0_12px_rgba(0,229,255,0.6)]"
                    >
                      {meetingCode.length === 8
                        ? `${meetingCode.slice(0, 4)}-${meetingCode.slice(4)}`
                        : meetingCode}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(meetingCode);
                      toast({ title: "Classroom Code Copied" });
                    }}
                    className="border-cyan-500/30 bg-cyber-elevated hover:bg-cyber-muted hover:border-cyan-400 text-cyan-300 transition-all duration-200"
                  >
                    <img src="/icons/copy.svg" alt="copy" width={16} height={16} />
                  </Button>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold text-cyan-200">Direct Meeting URL</label>
              <div
                className="flex-1 px-4 py-3 rounded-xl bg-cyber-surface border border-cyan-500/20"
              >
                <p className="text-xs font-mono truncate text-cyan-100/80">
                  {meetingLink}
                </p>
              </div>
            </div>
          </div>
        </MeetingModal>
      )}

      <MeetingModal
        isOpen={meetingState === "isJoiningMeeting"}
        onClose={() => { setMeetingState(undefined); setValues({ ...initialValues }); }}
        title="Join Classroom"
        className="text-center"
        buttonText="Connect to Classroom"
        handleClick={async () => {
          const code = values.meetingCode.trim();
          const link = values.link.trim();
          if (code) {
            await joinMeetingByCodeOrLink(code);
          } else if (link) {
            await joinMeetingByCodeOrLink(link);
          } else {
            toast({ title: "Please enter a meeting code or link" });
          }
        }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <label className={oceanLabel}>Enter 8-Digit Classroom Code</label>
            <Input
              placeholder="ABCD-1234"
              value={values.meetingCode}
              onChange={(e) => {
                const input = e.target.value.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 8);
                const formatted = input.length > 4 ? `${input.slice(0, 4)}-${input.slice(4)}` : input;
                setValues({ ...values, meetingCode: formatted });
              }}
              maxLength={9}
              className={`${oceanInput} text-center text-2xl font-mono font-bold tracking-widest uppercase text-cyan-300`}
            />
          </div>
          <div className="relative flex items-center gap-3">
            <div className="flex-1 border-t border-[rgba(0,180,255,0.15)]"></div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">OR PASTE LINK</span>
            <div className="flex-1 border-t border-[rgba(0,180,255,0.15)]"></div>
          </div>
          <div className="flex flex-col gap-3">
            <label className={oceanLabel}>Classroom Link or UUID</label>
            <Input
              placeholder="https://collabclass.app/meeting/uuid or UUID"
              value={values.link}
              onChange={(e) => setValues({ ...values, link: e.target.value })}
              className={oceanInput}
            />
          </div>
        </div>
      </MeetingModal>

      <MeetingModal
        isOpen={meetingState === "isInstantMeeting"}
        onClose={resetForm}
        title="Launch Instant Classroom"
        className="text-center"
        buttonText="Start Session Now"
        handleClick={createMeeting}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <label className={oceanLabel}>Classroom Heading</label>
            <Input
              className={oceanInput}
              placeholder="e.g. Quick Office Hours / Discussion"
              value={values.heading}
              onChange={(e) => setValues({ ...values, heading: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-3">
            <label className={oceanLabel}>Subject / Topic (Optional)</label>
            <Input
              className={oceanInput}
              placeholder="e.g. React 18 Concurrency & Hooks review"
              value={values.subheading}
              onChange={(e) => setValues({ ...values, subheading: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-3">
            <label className={oceanLabel}>Session Notes</label>
            <Textarea
              className={oceanInput}
              placeholder="Add key goals or announcements for participants..."
              onChange={(e) => setValues({ ...values, description: e.target.value })}
            />
          </div>
        </div>
      </MeetingModal>
    </section>
  );
};

export default MeetingTypeList;
