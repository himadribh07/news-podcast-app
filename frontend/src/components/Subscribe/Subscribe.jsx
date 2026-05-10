import React from 'react';
import './Subscribe.css';

export default function Subscribe({
  eyebrow = '◇ Listen anywhere',
  title,
  description = 'Free, ad-light, and never longer than it needs to be. Subscribe on your platform of choice.',
  platforms = DEFAULT_PLATFORMS,
  onSelect,
}) {
  const defaultTitle = (
    <>Every story, <span className="sig-it">every</span> weekday.<br />In your feed at your time.</>
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
    </section>
  );
}

const DEFAULT_PLATFORMS = [
  { glyph: '◐', name: 'Apple Podcasts', href: '#' },
  { glyph: '◑', name: 'Spotify', href: '#' },
  { glyph: '◒', name: 'Overcast', href: '#' },
  { glyph: '◓', name: 'RSS Feed', href: '#' },
];