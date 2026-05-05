import React from 'react';

export default function BrandMark({
  name = 'Signal',
  tag = 'Daily Briefing',
  href = '#',
}) {
  return (
    <a href={href} className="sig-brand">
      <span className="sig-brand__mark" />
      <span className="sig-brand__name">{name}</span>
      <span className="sig-brand__divider">·</span>
      <span className="sig-brand__tag">{tag}</span>

      <style>{`
        .sig-brand {
          display: inline-flex;
          align-items: center;
          gap: 8px;

          font-family: var(--mono);
          font-size: clamp(10px, 2.5vw, 12px);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 500;
          color: var(--fg);

          white-space: nowrap; /* prevents weird wrapping */
        }

        .sig-brand__mark {
          width: clamp(16px, 4vw, 22px);
          height: clamp(16px, 4vw, 22px);
          flex-shrink: 0;

          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, var(--accent), var(--accent-deep));
          box-shadow: 0 0 0 1px oklch(0.78 0.14 65 / 0.3),
                      0 0 16px oklch(0.78 0.14 65 / 0.12);
          position: relative;
        }

        .sig-brand__mark::after {
          content: "";
          position: absolute;
          inset: 5px;
          border-radius: 50%;
          background: var(--bg);
        }

        .sig-brand__mark::before {
          content: "";
          position: absolute;
          inset: 8px;
          border-radius: 50%;
          background: var(--accent);
        }

        .sig-brand__divider {
          color: var(--fg-faint);
        }

        .sig-brand__tag {
          color: var(--fg-dim);
        }

        /* 🔥 Mobile fix */
        @media (max-width: 480px) {
          .sig-brand {
            gap: 6px;
            font-size: 10px;
          }

          .sig-brand__tag {
            display: none; /* remove clutter */
          }

          .sig-brand__divider {
            display: none;
          }
        }
      `}</style>
    </a>
  );
}