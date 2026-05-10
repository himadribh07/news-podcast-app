import React from 'react';
import BrandMark from '../Navbar/BrandMark';
import './Footer.css';

export default function Footer({
  about = 'An independent daily news podcast. Eight categories, one host, under seven minutes. Published every weekday at 6 AM IST.',
  columns = DEFAULT_COLUMNS,
  copyright = '© 2026 SIGNAL MEDIA CO.',
  tagline = 'MADE DAILY · INDIA',
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
    </footer>
  );
}

const DEFAULT_COLUMNS = [
  { title: 'Listen', links: [
    { label: 'Latest episode', href: '#featured-episode' },
    { label: 'Archive', href: '#archive' },
  ]},
  { title: 'About', links: [
    { label: 'Contact', href: '#' },
  ]},
  { title: 'More', links: [
    { label: 'Newsletter', href: '#' },
    { label: 'Support us', href: '#' },
  ]},
];