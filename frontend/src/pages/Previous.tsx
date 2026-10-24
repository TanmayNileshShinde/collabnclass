import CallList from "@/components/CallList";

const Previous = () => {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .previous-page {
          font-family: 'DM Sans', sans-serif;
          position: relative;
          display: flex;
          width: 100%;
          height: 100%;
          flex-direction: column;
          gap: 36px;
          padding: 40px 36px;
          background: linear-gradient(160deg, #040c18 0%, #060f1e 50%, #030a14 100%);
          min-height: 100vh;
          overflow: hidden;
        }

        /* Ambient background orbs */
        .previous-page::before {
          content: '';
          position: fixed;
          top: -120px;
          right: -80px;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 120, 255, 0.055) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }

        .previous-page::after {
          content: '';
          position: fixed;
          bottom: -100px;
          left: -60px;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 80, 200, 0.04) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }

        
        :not(.dark) .previous-page {
          background: linear-gradient(160deg, #f8fafc 0%, #f0f7fe 50%, #e2e8f0 100%) !important;
          color: #0f172a !important;
        }

        :not(.dark) .previous-title {
          background: linear-gradient(135deg, #091e42 0%, #0284c7 50%, #0369a1 100%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
        }

        :not(.dark) .previous-title-sub {
          color: #475569 !important;
        }

        .previous-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 36px;
        }

        /* Header block */
        .previous-header {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .previous-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(0, 160, 255, 0.65);
        }

        .previous-eyebrow-line {
          width: 24px;
          height: 1px;
          background: linear-gradient(90deg, rgba(0, 160, 255, 0.6), transparent);
        }

        .previous-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.8rem, 3vw, 2.6rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin: 0;
          background: linear-gradient(135deg, #e0f0ff 0%, #90ccff 40%, #4899e8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          position: relative;
          display: inline-block;
        }

        .previous-title-sub {
          font-size: 0.88rem;
          font-weight: 400;
          color: rgba(100, 160, 220, 0.55);
          letter-spacing: 0.01em;
          margin-top: 4px;
        }

        /* Decorative separator */
        .previous-separator {
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, rgba(0, 140, 255, 0.2), rgba(0, 100, 200, 0.06), transparent);
          position: relative;
        }

        .previous-separator::before {
          content: '';
          position: absolute;
          left: 0; top: -1px;
          width: 60px; height: 3px;
          border-radius: 2px;
          background: linear-gradient(90deg, rgba(0, 160, 255, 0.8), transparent);
        }

        /* Scan-line texture overlay */
        .scanlines {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background-image: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.03) 2px,
            rgba(0, 0, 0, 0.03) 4px
          );
        }

        /* History icon chip */
        .history-chip {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 14px 5px 8px;
          border-radius: 30px;
          background: rgba(0, 80, 180, 0.1);
          border: 1px solid rgba(0, 140, 255, 0.15);
          width: fit-content;
          backdrop-filter: blur(4px);
        }

        .history-chip-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: rgba(0, 160, 255, 0.7);
          box-shadow: 0 0 6px rgba(0, 160, 255, 0.5);
        }

        .history-chip-label {
          font-size: 0.73rem;
          font-weight: 500;
          color: rgba(80, 180, 255, 0.8);
          letter-spacing: 0.04em;
        }

        /* CallList wrapper */
        .calllist-wrapper {
          position: relative;
          z-index: 1;
        }

        /* Fade-in animation for page load */
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .previous-header {
          animation: fadeSlideUp 0.5s ease forwards;
        }

        .calllist-wrapper {
          animation: fadeSlideUp 0.6s ease 0.1s both;
        }
      `}</style>

      <div className="previous-page">
        <div className="scanlines" />

        <div className="previous-content">
          {/* Header */}
          <header className="previous-header">
            <div className="history-chip">
              <span className="history-chip-dot" />
              <span className="history-chip-label">Call Archive</span>
            </div>

            <div>
              <h1 className="previous-title">Previous Calls</h1>
              <p className="previous-title-sub">Browse and revisit your past meetings</p>
            </div>

            <div className="previous-separator" />
          </header>

          {/* Call list */}
          <div className="calllist-wrapper">
            <CallList type="ended" />
          </div>
        </div>
      </div>
    </>
  );
};

export default Previous;