import { useUser } from '@clerk/clerk-react';
import { useStreamVideoClient } from '@stream-io/video-react-sdk';
import { useNavigate } from 'react-router-dom';
import { Copy, Video, Link2, Calendar } from 'lucide-react';

import { useGetCallById } from '@/hooks/useGetCallById';
import { useToast } from '@/components/ui/use-toast';

const InfoCard = ({
  icon: Icon,
  title,
  description,
  accent = false,
}: {
  icon: any;
  title: string;
  description: string;
  accent?: boolean;
}) => {
  return (
    <div className={`info-card${accent ? ' info-card--accent' : ''}`}>
      <div className="info-card-icon-wrap">
        <Icon className="info-card-icon" />
      </div>
      <div className="info-card-body">
        <h3 className="info-card-label">{title}</h3>
        <p className="info-card-value">{description}</p>
      </div>
      <div className="info-card-shimmer" />
    </div>
  );
};

const PersonalRoom = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const client = useStreamVideoClient();
  const { toast } = useToast();

  const meetingId = user?.id;
  const { call } = useGetCallById(meetingId!);

  const startRoom = async () => {
    if (!client || !user) return;
    const newCall = client.call('default', meetingId!);
    if (!call) {
      await newCall.getOrCreate({
        data: { starts_at: new Date().toISOString() },
      });
    }
    navigate(`/meeting/${meetingId}?personal=true`);
  };

  const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin;
  const meetingLink = `${baseUrl}/meeting/${meetingId}?personal=true`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        :root {
          --ocean-900: #030b16;
          --ocean-800: #050f1e;
          --ocean-700: #071525;
          --ocean-600: #0a1e34;
          --ocean-500: #0d2847;
          --ocean-400: #0e3a6a;
          --blue-glow: rgba(0, 140, 255, 0.18);
          --blue-mid:  rgba(0, 160, 255, 0.55);
          --blue-bright: #3ab0ff;
          --text-primary: #deeeff;
          --text-muted: rgba(100, 170, 230, 0.6);
        }

        
        :not(.dark) {
          --ocean-900: #f8fafc;
          --ocean-800: #f0f7fe;
          --ocean-700: #e2e8f0;
          --ocean-600: #cbd5e1;
          --ocean-500: #94a3b8;
          --ocean-400: #0284c7;
          --blue-glow: rgba(2, 132, 199, 0.12);
          --blue-mid:  rgba(2, 132, 199, 0.6);
          --blue-bright: #0284c7;
          --text-primary: #0f172a;
          --text-muted: #64748b;
        }

        :not(.dark) .pr-title {
          background: linear-gradient(135deg, #091e42 0%, #0284c7 60%, #0369a1 100%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
        }

        :not(.dark) .info-card {
          background: #ffffff !important;
          border: 1px solid rgba(2, 132, 199, 0.18) !important;
          box-shadow: 0 4px 20px rgba(0, 60, 140, 0.06) !important;
        }

        :not(.dark) .info-card-value {
          color: #0f172a !important;
        }

        :not(.dark) .info-card-label {
          color: #64748b !important;
        }

        .pr-page {
          font-family: 'DM Sans', sans-serif;
          position: relative;
          display: flex;
          width: 100%;
          height: 100%;
          flex-direction: column;
          gap: 40px;
          padding: 44px 40px;
          background: linear-gradient(150deg, var(--ocean-900) 0%, var(--ocean-800) 60%, #020810 100%);
          min-height: 100vh;
          overflow: hidden;
          color: var(--text-primary);
        }

        /* Atmosphere */
        .pr-orb-1 {
          position: fixed;
          top: -140px; right: -100px;
          width: 560px; height: 560px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 110, 255, 0.06) 0%, transparent 65%);
          pointer-events: none; z-index: 0;
        }
        .pr-orb-2 {
          position: fixed;
          bottom: -80px; left: -60px;
          width: 380px; height: 380px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 70, 200, 0.05) 0%, transparent 65%);
          pointer-events: none; z-index: 0;
        }
        .pr-scanlines {
          position: fixed; inset: 0;
          pointer-events: none; z-index: 0;
          background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.025) 2px, rgba(0,0,0,0.025) 4px);
        }

        .pr-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 40px;
          max-width: 860px;
        }

        /* ── Header ── */
        .pr-header { display: flex; flex-direction: column; gap: 10px; }

        .pr-tag {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          width: fit-content;
          padding: 4px 14px 4px 8px;
          border-radius: 30px;
          background: rgba(0, 90, 200, 0.12);
          border: 1px solid rgba(0, 140, 255, 0.18);
        }
        .pr-tag-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #3ab0ff;
          box-shadow: 0 0 8px rgba(58, 176, 255, 0.7);
          animation: tag-pulse 2s ease-in-out infinite;
        }
        @keyframes tag-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(0.85); }
        }
        .pr-tag-text {
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(80, 190, 255, 0.85);
        }

        .pr-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.9rem, 3.5vw, 2.8rem);
          font-weight: 800;
          letter-spacing: -0.035em;
          line-height: 1.1;
          margin: 0;
          background: linear-gradient(135deg, #e8f6ff 0%, #8ecfff 45%, #3a8ee8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .pr-subtitle {
          font-size: 0.9rem;
          font-weight: 300;
          font-style: italic;
          color: var(--text-muted);
          letter-spacing: 0.01em;
          margin: 0;
        }

        .pr-divider {
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, rgba(0, 150, 255, 0.25), rgba(0, 100, 200, 0.07), transparent);
          position: relative;
          margin-top: 4px;
        }
        .pr-divider::before {
          content: '';
          position: absolute;
          left: 0; top: -1px;
          width: 80px; height: 3px;
          border-radius: 2px;
          background: linear-gradient(90deg, rgba(0, 170, 255, 0.9), transparent);
        }

        /* ── Info Cards ── */
        .pr-cards { display: flex; flex-direction: column; gap: 12px; }

        .info-card {
          position: relative;
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 18px 22px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(5, 20, 45, 0.9), rgba(4, 14, 32, 0.95));
          border: 1px solid rgba(0, 130, 255, 0.1);
          overflow: hidden;
          transition: border-color 0.3s ease, transform 0.25s ease, box-shadow 0.3s ease;
          cursor: default;
        }
        .info-card:hover {
          border-color: rgba(0, 160, 255, 0.28);
          transform: translateX(4px);
          box-shadow: 0 4px 24px rgba(0, 100, 220, 0.1), -4px 0 16px rgba(0, 120, 255, 0.06);
        }
        .info-card--accent {
          border-color: rgba(0, 150, 255, 0.18);
          background: linear-gradient(135deg, rgba(0, 40, 100, 0.25), rgba(4, 14, 32, 0.95));
        }
        .info-card--accent:hover {
          border-color: rgba(0, 180, 255, 0.4);
        }

        .info-card-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(0, 140, 255, 0.03) 60%, transparent 70%);
          pointer-events: none;
        }

        .info-card-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px; height: 44px;
          flex-shrink: 0;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(0, 120, 255, 0.18), rgba(0, 70, 180, 0.1));
          border: 1px solid rgba(0, 150, 255, 0.2);
          box-shadow: 0 0 14px rgba(0, 130, 255, 0.1);
        }
        .info-card-icon {
          width: 20px; height: 20px;
          color: rgba(80, 185, 255, 0.9);
        }

        .info-card-body { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
        .info-card-label {
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(80, 160, 230, 0.6);
        }
        .info-card-value {
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          letter-spacing: -0.01em;
        }

        /* ── Action Buttons ── */
        .pr-actions { display: flex; flex-wrap: wrap; gap: 12px; }

        .btn-start {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 13px 28px;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          border: none;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #0075e0, #0055b8);
          color: #e8f4ff;
          box-shadow: 0 6px 22px rgba(0, 100, 230, 0.4), inset 0 1px 0 rgba(255,255,255,0.12);
          transition: all 0.25s ease;
        }
        .btn-start::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent 60%);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .btn-start:hover {
          background: linear-gradient(135deg, #0088f5, #0065cc);
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 120, 255, 0.5), inset 0 1px 0 rgba(255,255,255,0.15);
        }
        .btn-start:hover::before { opacity: 1; }
        .btn-start:active { transform: translateY(0); }

        .btn-copy {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 13px 28px;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          background: rgba(0, 50, 110, 0.15);
          color: rgba(130, 200, 255, 0.9);
          border: 1px solid rgba(0, 140, 255, 0.2);
          backdrop-filter: blur(4px);
          transition: all 0.25s ease;
        }
        .btn-copy:hover {
          background: rgba(0, 80, 160, 0.25);
          border-color: rgba(0, 170, 255, 0.4);
          color: #a8dcff;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 100, 200, 0.2);
        }

        /* ── Animations ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pr-header  { animation: fadeUp 0.5s ease both; }
        .pr-cards   { animation: fadeUp 0.55s ease 0.08s both; }
        .pr-actions { animation: fadeUp 0.55s ease 0.16s both; }
      `}</style>

      <div className="pr-page">
        <div className="pr-orb-1" />
        <div className="pr-orb-2" />
        <div className="pr-scanlines" />

        <div className="pr-content">

          {/* Header */}
          <header className="pr-header">
            <div className="pr-tag">
              <span className="pr-tag-dot" />
              <span className="pr-tag-text">Personal Room</span>
            </div>
            <h1 className="pr-title">Personal Meeting Room</h1>
            <p className="pr-subtitle">Your dedicated space for instant meetings</p>
            <div className="pr-divider" />
          </header>

          {/* Info Cards */}
          <div className="pr-cards">
            <InfoCard
              icon={Calendar}
              title="Topic"
              description={`${user?.username || 'Personal'}'s Meeting Room`}
            />
            <InfoCard
              icon={Video}
              title="Meeting ID"
              description={meetingId!}
            />
            <InfoCard
              icon={Link2}
              title="Invite Link"
              description={meetingLink}
              accent
            />
          </div>

          {/* Actions */}
          <div className="pr-actions">
            <button className="btn-start" onClick={startRoom}>
              <Video size={17} />
              Start Meeting
            </button>
            <button
              className="btn-copy"
              onClick={() => {
                navigator.clipboard.writeText(meetingLink);
                toast({
                  title: 'Link Copied',
                  description: 'Meeting link copied to clipboard',
                });
              }}
            >
              <Copy size={17} />
              Copy Invitation
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default PersonalRoom;