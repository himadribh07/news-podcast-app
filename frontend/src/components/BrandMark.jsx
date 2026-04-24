import React from 'react';

/**
 * Logo lockup: amber dot + brand text + tagline.
 * Used in the nav and footer.
 */
export default function BrandMark({
  name = 'Signal',
  tag = 'Daily Briefing',
  href = '#',
}) {
  return (
    <a href={href} className="sig-brand">
      <span className="sig-brand__mark" />
      <span>{name}</span>
      <span className="sig-brand__divider">·</span>
      <span className="sig-brand__tag">{tag}</span>

      <style>{`
        .sig-brand {
          display: inline-flex; align-items: center; gap: 10px;
          font-family: var(--mono); font-size: 11px; letter-spacing: 0.12em;
          text-transform: uppercase; font-weight: 500;
          color: var(--fg);
        }
        .sig-brand__mark {
          width: 22px; height: 22px; border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, var(--accent), var(--accent-deep));
          box-shadow: 0 0 0 1px oklch(0.78 0.14 65 / 0.3),
                      0 0 24px oklch(0.78 0.14 65 / 0.15);
          position: relative;
        }
        .sig-brand__mark::after {
          content: ""; position: absolute; inset: 6px;
          border-radius: 50%; background: var(--bg);
        }
        .sig-brand__mark::before {
          content: ""; position: absolute; inset: 9px;
          border-radius: 50%; background: var(--accent);
        }
        .sig-brand__divider { color: var(--fg-faint); }
        .sig-brand__tag     { color: var(--fg-dim); }
      `}</style>
    </a>
  );
}
