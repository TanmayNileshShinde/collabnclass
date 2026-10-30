import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import Loader from "./Loader";
import { supabase } from "@/lib/supabaseClient";
import { RefreshCw, Users, Clock, LogIn, LogOut, AlertCircle } from "lucide-react";

interface AttendanceRecord {
  id: string;
  meeting_id: string;
  user_id: string;
  user_name: string;
  joined_at: string;
  left_at: string | null;
}

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  meetingTitle: string;
}

const AttendanceModal = ({ isOpen, onClose, meetingId, meetingTitle }: AttendanceModalProps) => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAttendance = async (silent = false) => {
    if (!meetingId) return;
    silent ? setIsRefreshing(true) : setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('meeting_attendance')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('joined_at', { ascending: true });

      if (error) { console.error('Error fetching attendance:', error); return; }
      setAttendance(data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const calculateDuration = (joinedAt: string, leftAt: string | null) => {
    if (!leftAt) return null; // still in meeting
    const durationMs = new Date(leftAt).getTime() - new Date(joinedAt).getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatTime = (timeString: string) =>
    new Date(timeString).toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || "U";
  };

  const stillInMeeting = attendance.filter(r => !r.left_at).length;

  useEffect(() => {
    if (isOpen && meetingId) fetchAttendance();
  }, [isOpen, meetingId]);

  return (  
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .am-overlay [role="dialog"] {
          font-family: 'DM Sans', sans-serif;
          background: linear-gradient(145deg, #050d1a, #071525, #040e1c) !important;
          border: 1px solid rgba(0, 140, 255, 0.14) !important;
          border-radius: 20px !important;
          box-shadow: 0 0 0 1px rgba(0,160,255,0.04),
                      0 24px 80px rgba(0,0,0,0.75),
                      0 0 60px rgba(0,80,200,0.08) !important;
          color: #deeeff;
          max-width: 820px !important;
          max-height: 82vh !important;
          overflow: hidden !important;
          padding: 0 !important;
        }

        .am-top-glow {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,180,255,0.55), rgba(0,220,255,0.7), rgba(0,180,255,0.55), transparent);
          pointer-events: none;
          z-index: 10;
        }

        .am-inner {
          display: flex;
          flex-direction: column;
          height: 100%;
          max-height: 82vh;
          position: relative;
        }

        /* Header */
        .am-header {
          padding: 28px 32px 20px;
          border-bottom: 1px solid rgba(0,130,255,0.1);
          flex-shrink: 0;
          position: relative;
        }

        .am-eyebrow {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 8px;
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(80,175,255,0.6);
        }
        .am-eyebrow-line {
          width: 20px; height: 1px;
          background: rgba(0,160,255,0.4);
        }

        .am-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.35rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          margin: 0 0 2px;
          background: linear-gradient(135deg, #e8f6ff 0%, #8ecfff 50%, #3a8ee8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 600px;
        }

        .am-meeting-name {
          font-size: 0.82rem;
          color: rgba(100,165,230,0.55);
          font-style: italic;
          font-weight: 300;
          margin: 0;
        }

        /* Stat bar */
        .am-stats {
          display: flex;
          gap: 10px;
          padding: 16px 32px;
          border-bottom: 1px solid rgba(0,120,255,0.07);
          flex-shrink: 0;
          flex-wrap: wrap;
          align-items: center;
        }

        .am-stat {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 6px 14px;
          border-radius: 10px;
          background: rgba(0,50,110,0.15);
          border: 1px solid rgba(0,130,255,0.12);
          font-size: 0.8rem;
          font-weight: 500;
          color: rgba(120,190,255,0.8);
        }
        .am-stat svg { opacity: 0.7; }
        .am-stat-val { font-weight: 700; color: #a8d8ff; }

        .am-stat--active {
          background: rgba(0,160,120,0.08);
          border-color: rgba(0,200,150,0.18);
          color: rgba(0,210,160,0.85);
        }
        .am-stat--active .am-stat-val { color: #00dca8; }

        .am-refresh-btn {
          margin-left: auto;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.78rem;
          font-weight: 500;
          cursor: pointer;
          background: rgba(0,40,100,0.2);
          color: rgba(100,180,255,0.8);
          border: 1px solid rgba(0,130,255,0.18);
          transition: all 0.22s ease;
        }
        .am-refresh-btn:hover {
          background: rgba(0,70,160,0.25);
          border-color: rgba(0,170,255,0.35);
          color: #a8dcff;
        }
        .am-refresh-btn svg {
          transition: transform 0.5s ease;
        }
        .am-refresh-btn.spinning svg {
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Scroll area */
        .am-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px 32px 28px;
          scrollbar-width: thin;
          scrollbar-color: rgba(0,120,255,0.2) transparent;
        }
        .am-body::-webkit-scrollbar { width: 4px; }
        .am-body::-webkit-scrollbar-track { background: transparent; }
        .am-body::-webkit-scrollbar-thumb {
          background: rgba(0,130,255,0.22);
          border-radius: 4px;
        }

        /* Table */
        .am-table-wrap {
          border-radius: 14px;
          border: 1px solid rgba(0,120,255,0.1);
          overflow: hidden;
        }

        .am-table {
          width: 100%;
          border-collapse: collapse;
        }

        .am-thead {
          background: rgba(0,30,70,0.5);
        }
        .am-thead th {
          padding: 12px 16px;
          text-align: left;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(80,160,230,0.6);
          border-bottom: 1px solid rgba(0,120,255,0.1);
        }
        .am-thead th:first-child { padding-left: 20px; }

        .am-row {
          border-bottom: 1px solid rgba(0,100,200,0.07);
          transition: background 0.2s ease;
        }
        .am-row:last-child { border-bottom: none; }
        .am-row:hover { background: rgba(0,80,180,0.07); }

        .am-td {
          padding: 13px 16px;
          font-size: 0.84rem;
          color: rgba(200,230,255,0.85);
          vertical-align: middle;
        }
        .am-td:first-child { padding-left: 20px; }

        /* Avatar + name */
        .am-user-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .am-avatar {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0a3060, #051a3a);
          border: 1px solid rgba(0,150,255,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          font-weight: 700;
          color: rgba(120,200,255,0.9);
          flex-shrink: 0;
        }

        /* Duration badge */
        .am-duration {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .am-duration--done {
          background: rgba(0,70,150,0.15);
          border: 1px solid rgba(0,130,255,0.15);
          color: rgba(100,185,255,0.85);
        }
        .am-duration--live {
          background: rgba(0,160,120,0.1);
          border: 1px solid rgba(0,200,150,0.2);
          color: rgba(0,210,160,0.9);
        }
        .am-live-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #00dca8;
          box-shadow: 0 0 5px rgba(0,220,168,0.7);
          animation: live-pulse 1.5s ease-in-out infinite;
        }
        @keyframes live-pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.5; transform:scale(0.8); }
        }

        /* Empty state */
        .am-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 60px 20px;
          color: rgba(80,150,220,0.5);
          text-align: center;
        }
        .am-empty-icon {
          width: 48px; height: 48px;
          border-radius: 14px;
          background: rgba(0,60,130,0.12);
          border: 1px solid rgba(0,120,255,0.1);
          display: flex; align-items: center; justify-content: center;
          color: rgba(0,140,255,0.4);
        }
        .am-empty p { font-size: 0.88rem; margin: 0; }

        /* Loader */
        .am-loader-wrap {
          display: flex; align-items: center; justify-content: center;
          padding: 60px 20px;
        }

        /* Fade in */
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .am-stats     { animation: fadeUp 0.4s ease both; }
        .am-table-wrap{ animation: fadeUp 0.45s ease 0.05s both; }
        .am-empty     { animation: fadeUp 0.4s ease both; }
      `}</style>

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="am-overlay">
          <div className="am-top-glow" />
          <div className="am-inner">

            {/* Header */}
            <DialogHeader className="am-header">
              <div className="am-eyebrow">
                <span className="am-eyebrow-line" />
                Attendance History
              </div>
              <DialogTitle className="am-title">{meetingTitle}</DialogTitle>
              <p className="am-meeting-name">Meeting ID: {meetingId}</p>
            </DialogHeader>

            {isLoading ? (
              <div className="am-loader-wrap"><Loader /></div>
            ) : (
              <>
                {/* Stats bar */}
                <div className="am-stats">
                  <div className="am-stat">
                    <Users size={13} />
                    <span>Total</span>
                    <span className="am-stat-val">{attendance.length}</span>
                  </div>
                  {stillInMeeting > 0 && (
                    <div className="am-stat am-stat--active">
                      <span className="am-live-dot" />
                      <span>Still in</span>
                      <span className="am-stat-val">{stillInMeeting}</span>
                    </div>
                  )}
                  <div className="am-stat">
                    <Clock size={13} />
                    <span>Left</span>
                    <span className="am-stat-val">{attendance.length - stillInMeeting}</span>
                  </div>

                  <button
                    className={`am-refresh-btn${isRefreshing ? ' spinning' : ''}`}
                    onClick={() => fetchAttendance(true)}
                  >
                    <RefreshCw size={12} />
                    Refresh
                  </button>
                </div>

                {/* Body */}
                <div className="am-body">
                  {attendance.length > 0 ? (
                    <div className="am-table-wrap">
                      <table className="am-table">
                        <thead className="am-thead">
                          <tr>
                            <th><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users size={11} />Participant</div></th>
                            <th><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><LogIn size={11} />Joined</div></th>
                            <th><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><LogOut size={11} />Left</div></th>
                            <th><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={11} />Duration</div></th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendance.map((record) => {
                            const duration = calculateDuration(record.joined_at, record.left_at);
                            return (
                              <tr key={record.id} className="am-row">
                                <td className="am-td">
                                  <div className="am-user-cell">
                                    <div className="am-avatar">{getInitials(record.user_name)}</div>
                                    {record.user_name}
                                  </div>
                                </td>
                                <td className="am-td">{formatTime(record.joined_at)}</td>
                                <td className="am-td" style={{ color: record.left_at ? undefined : 'rgba(0,210,160,0.6)' }}>
                                  {record.left_at ? formatTime(record.left_at) : '—'}
                                </td>
                                <td className="am-td">
                                  {duration === null ? (
                                    <span className="am-duration am-duration--live">
                                      <span className="am-live-dot" />
                                      Live
                                    </span>
                                  ) : (
                                    <span className="am-duration am-duration--done">
                                      {duration}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="am-empty">
                      <div className="am-empty-icon"><AlertCircle size={22} /></div>
                      <p>No attendance records found for this meeting.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AttendanceModal;