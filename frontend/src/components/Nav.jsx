import React from 'react';
import BrandMark from './BrandMark';

/**
 * Sticky top navigation.
 *
 * Props:
 *   links          [{ label, href }]      menu items
 *   onSubscribe()                         click handler for the Subscribe button
 *   onListenNow()                         click handler for the primary CTA
 *   onArchive()                           click handler for Archive link
 *   onEpisodes()                          click handler for Episodes link
 *   onHome()                              click handler for BrandMark click
 *   brandName, brandTag                   passed to <BrandMark />
 */
export default function Nav({
  links = [
    { label: 'Episodes', href: '#episodes', action: 'episodes' },
    { label: 'Archive', href: '#', action: 'archive' },
    { label: 'About', href: '#about' },
  ],
  onSubscribe,
  onListenNow,
  onArchive,
  onEpisodes,
  onHome,
  brandName,
  brandTag,
}) {
  const handleNavClick = (link, e) => {
    if (link.action === 'archive') {
      e.preventDefault();
      if (onArchive) {
        onArchive();
      }
    } else if (link.action === 'episodes') {
      e.preventDefault();
      if (onEpisodes) {
        onEpisodes();
      }
      // Allow browser to scroll to #episodes anchor after navigation
      setTimeout(() => {
        const el = document.getElementById('episodes');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleBrandClick = (e) => {
    e.preventDefault();

    if (onHome) {
      onHome();
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  return (
    <nav className="sig-nav">
      <div className="sig-wrap sig-nav__inner">

        {/* Brand / Logo */}
        <div className="sig-nav__brand">
          <a href="/" onClick={handleBrandClick}>
            <BrandMark
              name={brandName}
              tag={brandTag}
            />
          </a>
        </div>

        {/* Nav Links */}
        <div className="sig-nav__links">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={(e) => handleNavClick(l, e)}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Right Actions */}
        <div className="sig-nav__right">
          <button className="sig-btn" onClick={onSubscribe}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d="M4 11a9 9 0 0 1 9-9" />
              <path d="M4 4a16 16 0 0 1 16 16" />
              <circle cx="5" cy="19" r="1.5" fill="currentColor" />
            </svg>

            Subscribe
          </button>

          {/*
          <button className="sig-btn sig-btn--primary" onClick={onListenNow}>
            Listen now
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
          */}
        </div>
      </div>

      <style>{`
        .sig-nav {
          position: sticky;
          top: 0;
          z-index: 50;

          border-bottom: 1px solid var(--line);

          backdrop-filter: blur(12px);
          background: oklch(0.16 0.01 60 / 0.82);
        }

        .sig-nav__inner {
          display: flex;
          align-items: center;
          gap: 40px;

          height: 64px;
        }

        .sig-nav__brand a {
          display: inline-flex;
          align-items: center;

          text-decoration: none;
          color: inherit;
        }

        .sig-nav__links {
          display: flex;
          align-items: center;
          gap: 28px;

          margin-left: 8px;
        }

        .sig-nav__links a {
          display: inline-flex;
          align-items: center;

          font-family: var(--mono);
          font-size: 11px;
          font-weight: 400;
          line-height: 1;
          letter-spacing: 0.08em;
          text-transform: uppercase;

          color: var(--fg-dim);
          text-decoration: none;

          transition: color 0.15s ease;
        }

        .sig-nav__links a:hover {
          color: var(--fg);
        }

        .sig-nav__right {
          margin-left: auto;

          display: flex;
          align-items: center;
          gap: 8px;
        }

        @media (max-width: 900px) {
          .sig-nav__links {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
}