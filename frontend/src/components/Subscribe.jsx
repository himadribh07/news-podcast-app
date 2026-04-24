import React from 'react';

/**
 * "Listen anywhere" CTA block.
 *
 * Props:
 *   eyebrow
 *   title (node)
 *   description
 *   platforms  [{ name, href }]
 *   onSelect(platform)
 */
export default function Subscribe({
  eyebrow     = '◇ Listen anywhere',
  title,
  description = 'Free, ad-light, and never longer than it needs to be. Subscribe on your platform of choice.',
  platforms   = DEFAULT_PLATFORMS,
  onSelect,
}) {
  const defaultTitle = (
    <>Seven stories, <span className="sig-it">every</span> weekday.<br />In your feed by 6am.</>
  );

  return (
    <section className="sig-section">
      <div className="sig-wrap">
        <div className="sig-subscribe">
          <div>
            <div className="sig-eyebrow">{eyebrow}</div>
            <h2 className="sig-subscribe__title">{title ?? defaultTitle}</h2>
            <p className="sig-subscribe__desc">{description}</p>
          </div>

          <div className="sig-subscribe__platforms">
            {platforms.map((p) => (
              <a
                key={p.name}
                href={p.href ?? '#'}
                className="sig-platform"
                onClick={(e) => { if (onSelect) { e.preventDefault(); onSelect(p); } }}
              >
                <span className="sig-platform__name">{p.glyph} {p.name}</span>
                <span className="sig-platform__arrow">→</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .sig-subscribe {
          background: var(--bg-2);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 72px 56px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 60px;
          align-items: center;
          position: relative;
          overflow: hidden;
        }
        .sig-subscribe::after {
          content: ""; position: absolute;
          top: -50%; right: -20%; width: 500px; height: 500px;
          background: radial-gradient(circle, oklch(0.78 0.14 65 / 0.08), transparent 60%);
          pointer-events: none;
        }
        .sig-subscribe__title {
          font-family: var(--sans);
          font-size: clamp(30px, 3.5vw, 44px);
          line-height: 1.05; letter-spacing: -0.025em;
          font-weight: 500; margin: 0 0 20px;
          color: var(--fg);
        }
        .sig-subscribe__desc {
          color: var(--fg-dim); line-height: 1.6; font-size: 15px;
          margin: 0 0 24px; max-width: 460px;
        }
        .sig-subscribe__platforms {
          display: flex; flex-direction: column; gap: 10px;
        }
        .sig-platform {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px;
          border: 1px solid var(--line-2);
          border-radius: 10px;
          transition: border-color 0.15s, background 0.15s;
          color: var(--fg);
        }
        .sig-platform:hover {
          border-color: var(--accent);
          background: oklch(0.19 0.01 60);
        }
        .sig-platform__name {
          font-family: var(--mono); font-size: 12px; letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .sig-platform__arrow {
          font-family: var(--mono); font-size: 14px;
          color: var(--fg-faint);
          transition: transform 0.15s, color 0.15s;
        }
        .sig-platform:hover .sig-platform__arrow {
          color: var(--accent); transform: translateX(4px);
        }
        @media (max-width: 900px) {
          .sig-subscribe { grid-template-columns: 1fr; padding: 48px 32px; }
        }
      `}</style>
    </section>
  );
}

const DEFAULT_PLATFORMS = [
  { glyph: '◐', name: 'Apple Podcasts', href: '#' },
  { glyph: '◑', name: 'Spotify',        href: '#' },
  { glyph: '◒', name: 'Overcast',       href: '#' },
  { glyph: '◓', name: 'RSS Feed',       href: '#' },
];
