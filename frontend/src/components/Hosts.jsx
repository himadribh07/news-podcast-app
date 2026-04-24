import React from 'react';

/**
 * Hosts strip.
 *
 * Props:
 *   eyebrow, title (node)
 *   hosts   [{ name, role, photo? }]
 */
export default function Hosts({
  eyebrow = '◇ Hosts & contributors',
  title,
  hosts   = DEFAULT_HOSTS,
}) {
  const defaultTitle = (
    <>The voices <span className="sig-it">in your ear</span>.</>
  );

  return (
    <section className="sig-section">
      <div className="sig-wrap">
        <div className="sig-section__head">
          <div>
            <div className="sig-eyebrow">{eyebrow}</div>
            <h2 className="sig-section__title">{title ?? defaultTitle}</h2>
          </div>
        </div>

        <div className="sig-hosts">
          {hosts.map((h) => (
            <div key={h.name} className="sig-host">
              <div
                className="sig-host__img"
                style={h.photo ? { backgroundImage: `url(${h.photo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
              >
                {!h.photo && <span>portrait · {h.name.toLowerCase()}</span>}
              </div>
              <div className="sig-host__body">
                <h4 className="sig-host__name">{h.name}</h4>
                <div className="sig-host__role">{h.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .sig-hosts {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
        }
        .sig-host {
          border: 1px solid var(--line);
          border-radius: 12px;
          overflow: hidden;
          background: var(--bg-2);
        }
        .sig-host__img {
          aspect-ratio: 4/3;
          background:
            repeating-linear-gradient(135deg, oklch(0.22 0.01 60) 0 12px, oklch(0.25 0.012 60) 12px 13px);
          display: flex; align-items: center; justify-content: center;
        }
        .sig-host__img span {
          font-family: var(--mono); font-size: 11px;
          color: var(--fg-faint); letter-spacing: 0.08em;
        }
        .sig-host__body { padding: 20px 22px 24px; }
        .sig-host__name {
          font-size: 18px; font-weight: 500; margin: 0 0 4px;
          letter-spacing: -0.015em; color: var(--fg);
        }
        .sig-host__role {
          font-family: var(--mono); font-size: 11px;
          color: var(--fg-faint); letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        @media (max-width: 900px) {
          .sig-hosts { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}

const DEFAULT_HOSTS = [
  { name: 'Mara Okafor', role: 'Lead Host · 412 eps' },
  { name: 'Theo Bright', role: 'Climate & Energy · 94 eps' },
  { name: 'Ayo Chen',    role: 'Markets Desk · 67 eps' },
];
