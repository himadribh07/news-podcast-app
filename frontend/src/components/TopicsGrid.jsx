import React from 'react';

/**
 * 4-column grid of topic tiles.
 *
 * Props:
 *   eyebrow, title (node)
 *   topics    [{ name, count, italic? }]
 *   onSelect(topic)
 */
export default function TopicsGrid({
  eyebrow = '◇ Browse by topic',
  title,
  topics  = DEFAULT_TOPICS,
  onSelect,
}) {
  const defaultTitle = (
    <>Eight beats, <span className="sig-it">one feed</span>.</>
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

        <div className="sig-topics">
          {topics.map((t, i) => (
            <button key={t.name} className="sig-topic" onClick={() => onSelect?.(t)}>
              <div className="sig-topic__num">{String(i + 1).padStart(2, '0')}</div>
              <div className="sig-topic__name">
                {t.italic ? <em className="sig-it">{t.name}</em> : t.name}
              </div>
              <div className="sig-topic__count">{t.count} episodes →</div>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .sig-topics {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px;
          background: var(--line);
          border: 1px solid var(--line);
        }
        .sig-topic {
          background: var(--bg);
          padding: 32px 28px;
          transition: background 0.15s;
          display: flex; flex-direction: column; gap: 16px;
          min-height: 200px;
          justify-content: space-between;
          text-align: left;
          color: var(--fg);
        }
        .sig-topic:hover { background: var(--bg-2); }
        .sig-topic__num {
          font-family: var(--mono); font-size: 11px;
          color: var(--fg-faint); letter-spacing: 0.08em;
        }
        .sig-topic__name {
          font-family: var(--sans);
          font-size: 28px; font-weight: 500;
          letter-spacing: -0.02em; line-height: 1;
        }
        .sig-topic__name em {
          font-style: italic; font-weight: 400;
        }
        .sig-topic__count {
          font-family: var(--mono); font-size: 11px;
          color: var(--fg-dim); letter-spacing: 0.05em;
        }
        @media (max-width: 900px) {
          .sig-topics { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </section>
  );
}

const DEFAULT_TOPICS = [
  { name: 'Politics', count: 86 },
  { name: 'Markets',  count: 74 },
  { name: 'Tech',     count: 61 },
  { name: 'Climate',  count: 48, italic: true },
  { name: 'Energy',   count: 39 },
  { name: 'Culture',  count: 44 },
  { name: 'Science',  count: 32, italic: true },
  { name: 'World',    count: 58 },
];
