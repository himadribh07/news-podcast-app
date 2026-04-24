import React from 'react';

/**
 * Hero section.
 *
 * Props:
 *   eyebrowDate     string   small date pill text
 *   eyebrowDuration string   small duration pill text
 *   live            bool     show pulsing "Live" pill
 *   headline        node     the big H1 — wrap any words you want italic
 *                            in <span className="sig-it">…</span>
 *   thesisTag       string   short bracket tag, e.g. "[thesis]"
 *   thesisText      string   one-liner shown next to the tag
 *   sub             string   paragraph under the headline
 *   primaryLabel    string   primary CTA label
 *   secondaryLabel  string   secondary CTA label
 *   onPrimary, onSecondary   click handlers
 */
export default function Hero({
  eyebrowDate,
  eyebrowDuration = '18 min',
  live            = true,
  headline,
  thesisTag       = '[thesis]',
  thesisText      = "seven stories. one host. eighteen minutes. before your coffee cools.",
  sub             = "Signal is a daily news podcast for people who want to stay informed without drowning. Every morning we pick seven stories that matter, explain them in plain language, and skip the rest.",
  primaryLabel    = "Play today's episode · 18:04",
  secondaryLabel  = 'Browse the archive',
  onPrimary,
  onSecondary,
}) {
  const defaultHeadline = (
    <>The news you need, <span className="sig-it">without</span> the noise you don't.</>
  );

  const formatEyebrowDate = (d) => {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    const weekday = d.toLocaleDateString(undefined, { weekday: 'long' });
    return `${mm} · ${dd} · ${yyyy} — ${weekday}`;
  };

  const displayEyebrowDate = eyebrowDate ?? formatEyebrowDate(new Date());

  return (
    <section className="sig-hero">
      <div className="sig-wrap">
        <div className="sig-hero__pills">
          {live && (
            <span className="sig-pill sig-pill--accent">
              <span className="sig-pill__dot sig-pill__dot--live" />
              Today's Briefing · Live
            </span>
          )}
          <span className="sig-pill">{displayEyebrowDate}</span>
          <span className="sig-pill">{eyebrowDuration}</span>
        </div>

        <h1 className="sig-hero__headline">{headline ?? defaultHeadline}</h1>

        <div className="sig-hero__thesis">
          <span className="sig-hero__thesis-tag">{thesisTag}</span>
          <span>{thesisText}</span>
        </div>

        <p className="sig-hero__sub">{sub}</p>

        <div className="sig-hero__ctas">
          <button className="sig-btn sig-btn--accent" onClick={onPrimary}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            {primaryLabel}
          </button>
          <button className="sig-btn" onClick={onSecondary}>
            {secondaryLabel}
            <span style={{ color: 'var(--accent)' }}>→</span>
          </button>
        </div>
      </div>

      <style>{`
        .sig-hero { padding: 96px 0 120px; position: relative; }
        .sig-hero::before {
          content: ""; position: absolute;
          top: 10%; right: -10%; width: 520px; height: 520px;
          background: radial-gradient(circle, oklch(0.78 0.14 65 / 0.08), transparent 60%);
          pointer-events: none;
        }
        .sig-hero__pills {
          display: flex; gap: 10px; align-items: center;
          margin-bottom: 40px; flex-wrap: wrap;
        }
        .sig-hero__headline {
          font-family: var(--sans);
          font-size: clamp(48px, 7.4vw, 104px);
          line-height: 0.98;
          letter-spacing: -0.035em;
          font-weight: 500;
          margin: 0 0 36px;
          max-width: 1000px;
          text-wrap: balance;
        }
        .sig-hero__thesis {
          display: flex; gap: 14px; align-items: baseline;
          margin-bottom: 20px;
          font-family: var(--mono); font-size: 12px;
          color: var(--fg-faint);
        }
        .sig-hero__thesis-tag { color: var(--accent); }
        .sig-hero__sub {
          max-width: 620px;
          font-size: 17px; line-height: 1.55;
          color: var(--fg-dim);
          margin: 0 0 40px;
        }
        .sig-hero__ctas { display: flex; gap: 10px; flex-wrap: wrap; }

        @media (max-width: 900px) {
          .sig-hero { padding: 56px 0 72px; }
          .sig-hero__headline { font-size: clamp(40px, 10vw, 64px); }
        }
      `}</style>
    </section>
  );
}
