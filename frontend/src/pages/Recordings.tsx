import CallList from '@/components/CallList';

const Recordings = () => {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        .rec-page {
          font-family: 'DM Sans', sans-serif;
          position: relative;
          display: flex;
          width: 100%;
          height: 100%;
          flex-direction: column;
          gap: 36px;
          padding: 44px 40px;
          background: linear-gradient(155deg, #030b16 0%, #050f1e 55%, #020810 100%);
          min-height: 100vh;
          overflow: hidden;
          color: #deeeff;
        }

        /* Atmosphere */
        .rec-orb-1 {
          position: fixed;
          top: -160px; right: -120px;
          width: 600px; height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 100, 255, 0.055) 0%, transparent 65%);
          pointer-events: none; z-index: 0;
        }
        .rec-orb-2 {
          position: fixed;
          bottom: -100px; left: -80px;
          width: 420px; height: 420px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(180, 0, 80, 0.03) 0%, transparent 65%);
          pointer-events: none; z-index: 0;
        }
        /* subtle diagonal beam */
        .rec-beam {
          position: fixed;
          top: 0; right: 0;
          width: 2px; height: 60vh;
          background: linear-gradient(180deg, transparent, rgba(0,160,255,0.08), transparent);
          transform: rotate(20deg) translateX(-200px);
          pointer-events: none; z-index: 0;
        }
        .rec-scanlines {
          position: fixed; inset: 0;
          pointer-events: none; z-index: 0;
          background-image: repeating-linear-gradient(
            0deg, transparent, transparent 2px,
            rgba(0,0,0,0.025) 2px, rgba(0,0,0,0.025) 4px
          );
        }

        
        :not(.dark) .rec-page {
          background: linear-gradient(155deg, #f8fafc 0%, #f0f7fe 55%, #e2e8f0 100%) !important;
          color: #0f172a !important;
        }

        :not(.dark) .rec-title {
          background: linear-gradient(135deg, #091e42 0%, #0284c7 50%, #0369a1 100%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
        }

        :not(.dark) .rec-subtitle {
          color: #475569 !important;
        }

        .rec-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 36px;
          height: 100%;
        }

        /* ── Header ── */
        .rec-header { display: flex; flex-direction: column; gap: 10px; }

        .rec-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          width: fit-content;
          padding: 4px 14px 4px 8px;
          border-radius: 30px;
          background: rgba(180, 0, 60, 0.08);
          border: 1px solid rgba(220, 0, 80, 0.18);
        }
        .rec-tag-icon {
          width: 16px; height: 16px;
          display: flex; align-items: center; justify-content: center;
        }
        .rec-tag-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #ff3366;
          box-shadow: 0 0 8px rgba(255, 50, 100, 0.8);
          animation: rec-blink 1.8s ease-in-out infinite;
        }
        @keyframes rec-blink {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(255,50,100,0.8); }
          50%       { opacity: 0.4; box-shadow: 0 0 4px rgba(255,50,100,0.3); }
        }
        .rec-tag-text {
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255, 100, 140, 0.85);
        }

        .rec-title-row {
          display: flex;
          align-items: baseline;
          gap: 16px;
        }
        .rec-title {
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

        .rec-subtitle {
          font-size: 0.88rem;
          font-weight: 300;
          font-style: italic;
          color: rgba(100, 160, 220, 0.55);
          letter-spacing: 0.01em;
          margin: 0;
        }

        .rec-divider {
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, rgba(0, 150, 255, 0.22), rgba(0, 100, 200, 0.06), transparent);
          position: relative;
          margin-top: 4px;
        }
        .rec-divider::before {
          content: '';
          position: absolute;
          left: 0; top: -1px;
          width: 80px; height: 3px;
          border-radius: 2px;
          background: linear-gradient(90deg, rgba(255, 50, 100, 0.7), rgba(0, 140, 255, 0.5), transparent);
        }

        /* ── Stat chips ── */
        .rec-stats {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .rec-stat-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 8px;
          background: rgba(0, 60, 130, 0.12);
          border: 1px solid rgba(0, 120, 255, 0.12);
          font-size: 0.75rem;
          font-weight: 500;
          color: rgba(100, 180, 255, 0.7);
          letter-spacing: 0.04em;
        }
        .rec-stat-chip svg {
          opacity: 0.65;
        }

        /* ── List area ── */
        .rec-list-wrap {
          flex: 1;
          overflow-y: auto;
          padding-right: 4px;
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 120, 255, 0.18) transparent;
        }
        .rec-list-wrap::-webkit-scrollbar {
          width: 4px;
        }
        .rec-list-wrap::-webkit-scrollbar-track {
          background: transparent;
        }
        .rec-list-wrap::-webkit-scrollbar-thumb {
          background: rgba(0, 130, 255, 0.2);
          border-radius: 4px;
        }
        .rec-list-wrap::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 150, 255, 0.35);
        }

        /* ── Animations ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .rec-header    { animation: fadeUp 0.48s ease both; }
        .rec-stats     { animation: fadeUp 0.5s ease 0.07s both; }
        .rec-list-wrap { animation: fadeUp 0.52s ease 0.14s both; }
      `}</style>

      <div className="rec-page">
        <div className="rec-orb-1" />
        <div className="rec-orb-2" />
        <div className="rec-beam" />
        <div className="rec-scanlines" />

        <div className="rec-content">

          {/* Header */}
          <header className="rec-header">
            <div className="rec-tag">
              <span className="rec-tag-icon"><span className="rec-tag-dot" /></span>
              <span className="rec-tag-text">Recorded Sessions</span>
            </div>

            <div className="rec-title-row">
              <h1 className="rec-title">Recordings</h1>
            </div>

            <p className="rec-subtitle">Replay, review, and share your captured meetings</p>
            <div className="rec-divider" />
          </header>

          {/* Stat chips */}
          <div className="rec-stats">
            <div className="rec-stat-chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              All time
            </div>
            <div className="rec-stat-chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V15"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Downloadable
            </div>
            <div className="rec-stat-chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              Shareable links
            </div>
          </div>

          {/* List */}
          <div className="rec-list-wrap">
            <CallList type="recordings" />
          </div>

        </div>
      </div>
    </>
  );
};

export default Recordings;