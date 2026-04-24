import React from 'react';
import BrandMark from './BrandMark';

/**
 * Sticky top navigation.
 *
 * Props:
 *   links          [{ label, href }]      menu items
 *   onSubscribe()                         click handler for the Subscribe button
 *   onListenNow()                         click handler for the primary CTA
 *   brandName, brandTag                   passed to <BrandMark />
 */
export default function Nav({
  links = [
    { label: 'Episodes', href: '#episodes' },
    { label: 'Topics',   href: '#topics'   },
    { label: 'Hosts',    href: '#hosts'    },
    { label: 'Archive',  href: '#archive'  },
    { label: 'About',    href: '#about'    },
  ],
  onSubscribe,
  onListenNow,
  brandName,
  brandTag,
}) {
  return (
    <nav className="sig-nav">
      <div className="sig-wrap sig-nav__inner">
        <BrandMark name={brandName} tag={brandTag} />

        <div className="sig-nav__links">
          {links.map((l) => (
            <a key={l.href} href={l.href}>{l.label}</a>
          ))}
        </div>

        <div className="sig-nav__right">
          <button className="sig-btn" onClick={onSubscribe}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M4 11a9 9 0 0 1 9-9" />
              <path d="M4 4a16 16 0 0 1 16 16" />
              <circle cx="5" cy="19" r="1.5" fill="currentColor" />
            </svg>
            Subscribe
          </button>
          <button className="sig-btn sig-btn--primary" onClick={onListenNow}>
            Listen now
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        .sig-nav {
          border-bottom: 1px solid var(--line);
          position: sticky; top: 0; z-index: 50;
          backdrop-filter: blur(12px);
          background: oklch(0.16 0.01 60 / 0.82);
        }
        .sig-nav__inner {
          display: flex; align-items: center; gap: 40px;
          height: 64px;
        }
        .sig-nav__links {
          display: flex; gap: 28px; margin-left: 8px;
        }
        .sig-nav__links a {
          font-family: var(--mono); font-size: 11px; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--fg-dim);
          transition: color 0.15s;
        }
        .sig-nav__links a:hover { color: var(--fg); }
        .sig-nav__right {
          margin-left: auto;
          display: flex; gap: 8px; align-items: center;
        }
        @media (max-width: 900px) {
          .sig-nav__links { display: none; }
        }
      `}</style>
    </nav>
  );
}
