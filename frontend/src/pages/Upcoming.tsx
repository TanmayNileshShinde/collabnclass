import CallList from '@/components/CallList';

const Upcoming = () => {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        .up-page {
          font-family: 'DM Sans', sans-serif;
          position: relative;
          display: flex;
          width: 100%;
          height: 100%;
          flex-direction: column;
          gap: 36px;
          padding: 44px 40px;
          background: linear-gradient(158deg, #030c18 0%, #050f1e 55%, #020810 100%);
          min-height: 100vh;
          overflow: hidden;
          color: #deeeff;
        }

        /* ── Atmosphere ── */
        .up-orb-1 {
          position: fixed;
          top: -180px; right: -140px;
          width: 640px; height: 640px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 130, 255, 0.06) 0%, transparent 65%);
          pointer-events: none; z-index: 0;
        }
        .up-orb-2 {
          position: fixed;
          bottom: -100px; left: -60px;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 200, 160, 0.035) 0%, transparent 65%);
          pointer-events: none; z-index: 0;
        }
        /* Horizon glow line */
        .up-horizon {
          position: fixed;
          top: 38%;
          left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(0,160,255,0.07) 30%, rgba(0,200,255,0.12) 50%, rgba(0,160,255,0.07) 70%, transparent 100%);
          pointer-events: none; z-index: 0;
        }
        .up-scanlines {
          position: fixed; inset: 0;
          pointer-events: none; z-index: 0;
          background-image: repeating-linear-gradient(
            0deg, transparent, transparent 2px,
            rgba(0,0,0,0.025) 2px, rgba(0,0,0,0.025) 4px
          );
        }

        
        :not(.dark) .up-page {
          background: linear-gradient(158deg, #f8fafc 0%, #f0f7fe 55%, #e2e8f0 100%) !important;
          color: #0f172a !important;
        }

        :not(.dark) .up-title {
          background: linear-gradient(135deg, #091e42 0%, #0284c7 60%, #0369a1 100%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
        }

        :not(.dark) .up-subtitle {
          color: #475569 !important;
        }

        .up-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 36px;
        }

        /* ── Header ── */
        .up-header { display: flex; flex-direction: column; gap: 10px; }

        .up-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          width: fit-content;
          padding: 4px 14px 4px 9px;
          border-radius: 30px;
          background: rgba(0, 180, 140, 0.08);
          border: 1px solid rgba(0, 210, 160, 0.2);
        }
        .up-tag-icon {
          position: relative;
          width: 16px; height: 16px;
          display: flex; align-items: center; justify-content: center;
        }
        .up-tag-ring {
          position: absolute;
          width: 14px; height: 14px;
          border-radius: 50%;
          border: 1.5px solid rgba(0, 220, 170, 0.5);
          animation: up-ring-pulse 2.2s ease-in-out infinite;
        }
        .up-tag-core {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #00dca8;
          box-shadow: 0 0 8px rgba(0, 220, 168, 0.9);
        }
        @keyframes up-ring-pulse {
          0%  { transform: scale(1);   opacity: 0.6; }
          60% { transform: scale(1.7); opacity: 0; }
          100%{ transform: scale(1);   opacity: 0; }
        }
        .up-tag-text {
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(0, 210, 160, 0.85);
        }

        .up-title {
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

        .up-subtitle {
          font-size: 0.88rem;
          font-weight: 300;
          font-style: italic;
          color: rgba(100, 160, 220, 0.55);
          letter-spacing: 0.01em;
          margin: 0;
        }

        .up-divider {
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, rgba(0, 150, 255, 0.22), rgba(0, 100, 200, 0.06), transparent);
          position: relative;
          margin-top: 4px;
        }
        .up-divider::before {
          content: '';
          position: absolute;
          left: 0; top: -1px;
          width: 80px; height: 3px;
          border-radius: 2px;
          background: linear-gradient(90deg, rgba(0, 220, 168, 0.8), rgba(0, 140, 255, 0.5), transparent);
        }

        /* ── Countdown strip ── */
        .up-strip {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .up-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 13px;
          border-radius: 8px;
          background: rgba(0, 60, 130, 0.12);
          border: 1px solid rgba(0, 120, 255, 0.12);
          font-size: 0.75rem;
          font-weight: 500;
          color: rgba(100, 180, 255, 0.7);
          letter-spacing: 0.04em;
        }
        .up-chip--green {
          background: rgba(0, 160, 120, 0.08);
          border-color: rgba(0, 200, 150, 0.18);
          color: rgba(0, 210, 160, 0.8);
        }
        .up-chip svg { opacity: 0.7; }

        /* ── List ── */
        .up-list { position: relative; z-index: 1; }

        /* ── Animations ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .up-header { animation: fadeUp 0.48s ease both; }
        .up-strip  { animation: fadeUp 0.5s ease 0.07s both; }
        .up-list   { animation: fadeUp 0.52s ease 0.14s both; }
      `}</style>

      <div className="up-page">
        <div className="up-orb-1" />
        <div className="up-orb-2" />
        <div className="up-horizon" />
        <div className="up-scanlines" />

        <div className="up-content">

          {/* Header */}
          <header className="up-header">
            <div className="up-tag">
              <span className="up-tag-icon">
                <span className="up-tag-ring" />
                <span className="up-tag-core" />
              </span>
              <span className="up-tag-text">Scheduled</span>
            </div>

            <h1 className="up-title">Upcoming Meetings</h1>
            <p className="up-subtitle">Your scheduled sessions, ready when you are</p>
            <div className="up-divider" />
          </header>

          {/* Context chips */}
          <div className="up-strip">
            <div className="up-chip up-chip--green">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Confirmed
            </div>
            <div className="up-chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Calendar synced
            </div>
            <div className="up-chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              Reminders on
            </div>
          </div>

          {/* List */}
          <div className="up-list">
            <CallList type="upcoming" />
          </div>

        </div>
      </div>
    </>
  );
};

export default Upcoming;