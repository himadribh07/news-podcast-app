import React, { useMemo } from 'react';

/**
 * Big "today's episode" hero card with placeholder cover art + waveform.
 *
 * Props:
 *   epNumber       number/string  shown in the cover art
 *   eyebrow        string         section eyebrow
 *   releasedAt     string         shown top-right of the section head
 *   isNew          bool
 *   show           string         e.g. "Morning Briefing"
 *   duration       string         "18 MIN"
 *   title          node           feature title — wrap italic words in <em>
 *   description    string
 *   currentTime    string         e.g. "04:12"
 *   totalTime      string         e.g. "18:04"
 *   progress       0..1           how much of the waveform is filled
 *   onPlay()                      play handler
 */
export default function FeaturedEpisode({
  epNumber    = 412,
  eyebrow     = '◇ Featured · Episode 412',
  sectionTitle,
  releasedAt  = 'Released · 04.24.2026 · 06:00 ET',
  isNew       = true,
  show        = 'Morning Briefing',
  duration    = '18 MIN',
  title,
  description = "Host Mara Okafor walks through rate-cut expectations, the quiet AI bill that moved out of committee last night, and why this month's census numbers are about to reshape three congressional districts — plus four more stories in under twenty minutes.",
  currentTime = '04:12',
  totalTime   = '18:04',
  progress    = 0.275,
  onPlay,
}) {
  const defaultTitle = (
    <>Markets brace for the Fed, and the <em>real</em> story behind the census release.</>
  );
  const defaultSectionTitle = (
    <>Today in <span className="sig-it">seven stories</span>.</>
  );

  // deterministic waveform bars
  const bars = useMemo(() => {
    const N = 80;
    const arr = [];
    for (let i = 0; i < N; i++) {
      const h = 18 + Math.abs(Math.sin(i * 0.37) * 14 + Math.cos(i * 0.21) * 10) + (i % 7) * 1.2;
      arr.push(Math.min(h, 46));
    }
    return arr;
  }, []);
  const playedTo = Math.round(bars.length * progress);

  return (
    <section className="sig-section">
      <div className="sig-wrap">
        <div className="sig-section__head">
          <div>
            <div className="sig-eyebrow">{eyebrow}</div>
            <h2 className="sig-section__title">{sectionTitle ?? defaultSectionTitle}</h2>
          </div>
          <div className="sig-feat__released">{releasedAt}</div>
        </div>

        <div className="sig-feat">
          <div className="sig-feat__art">
            <div className="sig-feat__epnum">EP / {epNumber}</div>
            <div className="sig-feat__hugenum">{epNumber}</div>
            <button className="sig-feat__play" aria-label="Play" onClick={onPlay}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
            <div className="sig-feat__artlabel">cover · episode art</div>
          </div>

          <div>
            <div className="sig-feat__meta">
              {isNew && <><span style={{ color: 'var(--accent)' }}>●</span> New <span className="sig-feat__sep">·</span></>}
              <span>{show}</span>
              <span className="sig-feat__sep">·</span>
              <span>{duration}</span>
            </div>

            <h3 className="sig-feat__title">{title ?? defaultTitle}</h3>
            <p className="sig-feat__desc">{description}</p>

            <div className="sig-feat__wave">
              {bars.map((h, i) => (
                <span
                  key={i}
                  className={i < playedTo ? 'played' : ''}
                  style={{ height: h + 'px' }}
                />
              ))}
            </div>
            <div className="sig-feat__time">
              <span>{currentTime}</span>
              <span>{totalTime}</span>
            </div>

            <div className="sig-feat__actions">
              <button className="sig-btn sig-btn--primary" onClick={onPlay}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Play episode
              </button>
              <button className="sig-btn">Show notes</button>
              <button className="sig-btn">Transcript</button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .sig-feat {
          display: grid; grid-template-columns: 1.1fr 1fr;
          gap: 60px; align-items: center;
        }
        .sig-feat__released {
          font-family: var(--mono); font-size: 11px;
          color: var(--fg-faint); letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .sig-feat__art {
          aspect-ratio: 4/5;
          background: linear-gradient(135deg, var(--bg-2), var(--bg-3));
          border: 1px solid var(--line);
          border-radius: 14px;
          position: relative;
          overflow: hidden;
        }
        .sig-feat__art::before {
          content: ""; position: absolute; inset: 0;
          background-image:
            repeating-linear-gradient(45deg, transparent 0 10px, oklch(0.3 0.012 60 / 0.35) 10px 11px);
        }
        .sig-feat__epnum {
          position: absolute; top: 20px; left: 20px;
          font-family: var(--mono); font-size: 11px;
          color: var(--fg-dim); letter-spacing: 0.08em;
        }
        .sig-feat__artlabel {
          position: absolute; bottom: 20px; left: 20px;
          font-family: var(--mono); font-size: 11px;
          color: var(--fg-faint); letter-spacing: 0.05em;
        }
        .sig-feat__hugenum {
          position: absolute; bottom: 0; right: 0;
          font-family: var(--serif); font-style: italic;
          font-size: 320px; line-height: 0.85;
          color: oklch(0.78 0.14 65 / 0.08);
          pointer-events: none;
        }
        .sig-feat__play {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 88px; height: 88px; border-radius: 50%;
          background: var(--fg);
          color: var(--bg);
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.2s, background 0.2s;
        }
        .sig-feat__play:hover {
          background: var(--accent);
          transform: translate(-50%, -50%) scale(1.06);
        }
        .sig-feat__play svg { margin-left: 4px; }

        .sig-feat__meta {
          display: flex; gap: 12px; align-items: center;
          font-family: var(--mono); font-size: 11px;
          color: var(--fg-faint); letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 20px;
        }
        .sig-feat__sep { color: var(--fg-faint); }
        .sig-feat__title {
          font-family: var(--sans);
          font-size: clamp(30px, 3.5vw, 44px);
          line-height: 1.05; letter-spacing: -0.025em;
          font-weight: 500; margin: 0 0 20px;
          text-wrap: balance;
        }
        .sig-feat__title em {
          font-family: var(--serif); font-style: italic; font-weight: 400;
          color: var(--accent);
        }
        .sig-feat__desc {
          color: var(--fg-dim); line-height: 1.6; font-size: 16px;
          margin-bottom: 32px;
        }
        .sig-feat__wave {
          display: flex; align-items: end; gap: 3px;
          height: 48px; margin-bottom: 12px;
        }
        .sig-feat__wave span {
          flex: 1; background: var(--fg-faint); border-radius: 2px;
          transition: background 0.2s;
        }
        .sig-feat__wave span.played { background: var(--accent); }
        .sig-feat__wave:hover span { background: var(--fg-dim); }
        .sig-feat__wave:hover span.played { background: var(--accent); }
        .sig-feat__time {
          display: flex; justify-content: space-between;
          font-family: var(--mono); font-size: 11px;
          color: var(--fg-faint); margin-bottom: 32px;
        }
        .sig-feat__actions { display: flex; gap: 10px; flex-wrap: wrap; }

        @media (max-width: 900px) {
          .sig-feat { grid-template-columns: 1fr; gap: 40px; }
          .sig-feat__hugenum { font-size: 220px; }
        }
      `}</style>
    </section>
  );
}
