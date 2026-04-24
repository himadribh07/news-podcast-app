import React from 'react';

/**
 * Recent-episodes table.
 *
 * Props:
 *   eyebrow     string
 *   title       node           e.g. <>The last <span className="sig-it">two weeks</span></>
 *   episodes    Episode[]
 *   onPlay(ep)
 *   onViewAll()
 *   viewAllLabel string
 *
 * Episode shape:
 *   { id, num, title, by, category, date, duration }
 */
export default function EpisodeList({
  eyebrow      = '◇ Recent episodes',
  title,
  episodes     = DEFAULT_EPISODES,
  onPlay,
  onViewAll,
  viewAllLabel = 'View all 412 →',
}) {
  const defaultTitle = (
    <>The last <span className="sig-it">two weeks</span>, indexed.</>
  );

  return (
    <section className="sig-section">
      <div className="sig-wrap">
        <div className="sig-section__head">
          <div>
            <div className="sig-eyebrow">{eyebrow}</div>
            <h2 className="sig-section__title">{title ?? defaultTitle}</h2>
          </div>
          <button className="sig-btn" onClick={onViewAll}>{viewAllLabel}</button>
        </div>

        <div className="sig-eplist">
          {episodes.map((ep) => (
            <div key={ep.id ?? ep.num} className="sig-eprow" onClick={() => onPlay?.(ep)}>
              <div className="sig-eprow__num">{String(ep.num).padStart(3, '0')}</div>
              <div className="sig-eprow__title">
                <h3>{ep.title}</h3>
                <div className="sig-eprow__by">{ep.by}</div>
              </div>
              <span className="sig-eprow__cat">{ep.category}</span>
              <div className="sig-eprow__date">{ep.date}</div>
              <div className="sig-eprow__dur">{ep.duration}</div>
              <button
                className="sig-eprow__play"
                onClick={(e) => { e.stopPropagation(); onPlay?.(ep); }}
                aria-label={`Play episode ${ep.num}`}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .sig-eplist { border-top: 1px solid var(--line); }
        .sig-eprow {
          display: grid;
          grid-template-columns: 60px 1fr 120px 200px 80px 50px;
          align-items: center;
          gap: 24px;
          padding: 22px 0;
          border-bottom: 1px solid var(--line);
          transition: background 0.15s;
          cursor: pointer;
        }
        .sig-eprow:hover { background: oklch(0.19 0.01 60 / 0.5); }
        .sig-eprow:hover .sig-eprow__play {
          background: var(--accent); color: var(--bg);
        }
        .sig-eprow__num {
          font-family: var(--mono); font-size: 12px;
          color: var(--fg-faint);
        }
        .sig-eprow__title h3 {
          font-size: 17px; font-weight: 500; margin: 0 0 4px;
          letter-spacing: -0.015em; color: var(--fg);
        }
        .sig-eprow__by { font-size: 13px; color: var(--fg-faint); }
        .sig-eprow__cat {
          font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--fg-dim);
          padding: 5px 10px; border: 1px solid var(--line-2); border-radius: 999px;
          display: inline-block; justify-self: start;
        }
        .sig-eprow__date, .sig-eprow__dur {
          font-family: var(--mono); font-size: 12px;
          color: var(--fg-faint);
        }
        .sig-eprow__dur { text-align: right; }
        .sig-eprow__play {
          width: 36px; height: 36px; border-radius: 50%;
          border: 1px solid var(--line-2);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
          justify-self: end;
          color: var(--fg);
        }

        @media (max-width: 900px) {
          .sig-eprow {
            grid-template-columns: 40px 1fr 60px;
            gap: 14px;
          }
          .sig-eprow__cat, .sig-eprow__date { display: none; }
        }
      `}</style>
    </section>
  );
}

const DEFAULT_EPISODES = [
  { num: 411, title: 'The quiet AI regulation bill that everyone missed', by: 'with Mara Okafor & guest Sen. D. Velasquez', category: 'Politics', date: 'Apr 23 · Thu', duration: '17:48' },
  { num: 410, title: "What the census actually said — and didn't",         by: 'with Mara Okafor',           category: 'Data',     date: 'Apr 22 · Wed', duration: '19:02' },
  { num: 409, title: "Inside the grid crisis nobody's calling a crisis",   by: 'with Theo Bright',           category: 'Energy',   date: 'Apr 21 · Tue', duration: '21:15' },
  { num: 408, title: 'One year of the new trade deal, in numbers',         by: 'with Mara Okafor & Ayo Chen',category: 'Markets',  date: 'Apr 18 · Fri', duration: '18:30' },
  { num: 407, title: 'Climate money, finally moving',                       by: 'with Theo Bright',           category: 'Climate',  date: 'Apr 17 · Thu', duration: '16:55' },
  { num: 406, title: 'The housing story hiding in plain sight',             by: 'with Mara Okafor',           category: 'Economy',  date: 'Apr 16 · Wed', duration: '18:12' },
];
