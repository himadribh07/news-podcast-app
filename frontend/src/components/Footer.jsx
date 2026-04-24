import React from 'react';
import BrandMark from './BrandMark';

/**
 * Site footer.
 *
 * Props:
 *   about   string             paragraph under brand mark
 *   columns [{ title, links: [{label, href}] }]
 *   copyright
 *   tagline
 *   brandName, brandTag
 */
export default function Footer({
  about = 'An independent daily news podcast. Seven stories, one host, eighteen minutes. Published every weekday at 6am Eastern.',
  columns = DEFAULT_COLUMNS,
  copyright = '© 2026 SIGNAL MEDIA CO.',
  tagline   = 'MADE DAILY · BROOKLYN / LAGOS',
  brandName,
  brandTag,
}) {
  return (
    <footer className="sig-footer">
      <div className="sig-wrap">
        <div className="sig-footer__grid">
          <div>
            <BrandMark name={brandName} tag={brandTag} />
            <p className="sig-footer__about">{about}</p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h5>{col.title}</h5>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}><a href={l.href}>{l.label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="sig-footer__bottom">
          <span>{copyright}</span>
          <span>{tagline}</span>
        </div>
      </div>

      <style>{`
        .sig-footer {
          padding: 80px 0 48px;
          border-top: 1px solid var(--line);
        }
        .sig-footer__grid {
          display: grid; grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 60px; margin-bottom: 60px;
        }
        .sig-footer h5 {
          font-family: var(--mono); font-size: 11px; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--fg-faint);
          margin: 0 0 16px; font-weight: 500;
        }
        .sig-footer ul {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 8px;
        }
        .sig-footer ul a {
          font-size: 14px; color: var(--fg-dim);
          transition: color 0.15s;
        }
        .sig-footer ul a:hover { color: var(--fg); }
        .sig-footer__about {
          font-size: 14px; color: var(--fg-dim); line-height: 1.6;
          margin: 16px 0 0; max-width: 380px;
        }
        .sig-footer__bottom {
          display: flex; justify-content: space-between; align-items: center;
          padding-top: 32px; border-top: 1px solid var(--line);
          font-family: var(--mono); font-size: 11px;
          color: var(--fg-faint); letter-spacing: 0.05em;
        }
        @media (max-width: 900px) {
          .sig-footer__grid { grid-template-columns: 1fr 1fr; gap: 32px; }
          .sig-footer__bottom { flex-direction: column; gap: 12px; }
        }
      `}</style>
    </footer>
  );
}

const DEFAULT_COLUMNS = [
  { title: 'Listen', links: [
    { label: 'Latest episode', href: '#' },
    { label: 'Archive',        href: '#' },
    { label: 'Transcripts',    href: '#' },
    { label: 'RSS',            href: '#' },
  ]},
  { title: 'About', links: [
    { label: 'Our method', href: '#' },
    { label: 'Hosts',      href: '#' },
    { label: 'Newsroom',   href: '#' },
    { label: 'Contact',    href: '#' },
  ]},
  { title: 'More', links: [
    { label: 'Newsletter', href: '#' },
    { label: 'Merch',      href: '#' },
    { label: 'Press',      href: '#' },
    { label: 'Support us', href: '#' },
  ]},
];
