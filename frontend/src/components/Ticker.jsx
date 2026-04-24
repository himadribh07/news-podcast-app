import React from 'react';

/**
 * Auto-scrolling marquee of recent episode headlines.
 *
 * Props:
 *   items       [{ ep: 'EP 412', title: 'Markets brace for Fed' }]
 *   speed       seconds for one full loop (default 60)
 */
export default function Ticker({
  items = [
    { ep: 'EP 412', title: 'Markets brace for Fed' },
    { ep: 'EP 411', title: 'The quiet AI regulation bill' },
    { ep: 'EP 410', title: 'What the census actually said' },
    { ep: 'EP 409', title: 'Inside the grid crisis' },
    { ep: 'EP 408', title: 'One year of the new trade deal' },
    { ep: 'EP 407', title: 'Climate money, finally moving' },
  ],
  speed = 60,
}) {
  // duplicate for seamless loop
  const loop = [...items, ...items];

  return (
    <div className="sig-ticker">
      <div
        className="sig-ticker__track"
        style={{ animationDuration: `${speed}s` }}
      >
        {loop.map((it, i) => (
          <span key={i} className="sig-ticker__item">
            <span className="sig-ticker__ep">{it.ep}</span>
            <span>{it.title}</span>
            <span className="sig-ticker__dot" />
          </span>
        ))}
      </div>

      <style>{`
        .sig-ticker {
          border-top: 1px solid var(--line);
          border-bottom: 1px solid var(--line);
          overflow: hidden;
          font-family: var(--mono); font-size: 12px;
          color: var(--fg-dim);
          letter-spacing: 0.05em;
        }
        .sig-ticker__track {
          display: flex; gap: 48px;
          padding: 14px 0;
          white-space: nowrap;
          animation: sig-marquee linear infinite;
          width: max-content;
        }
        @keyframes sig-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .sig-ticker__item {
          display: inline-flex; gap: 10px; align-items: center;
        }
        .sig-ticker__ep  { color: var(--accent); }
        .sig-ticker__dot {
          width: 3px; height: 3px;
          background: var(--fg-faint);
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
}
