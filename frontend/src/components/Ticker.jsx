import React, { useEffect, useState } from 'react';
import API_BASE_URL from '../utils/apiConfig';

/**
 * Auto-scrolling marquee of recent episode headlines (last 7 days).
 *
 * Props:
 *   speed       seconds for one full loop (default 60)
 */
export default function Ticker({ speed = 60 }) {
  const [items, setItems] = useState([]);

  // Get today's date in "Nth_Month" format
  const getTodayDateStr = () => {
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleString('en-US', { month: 'long' });
    
    let suffix = 'th';
    if (!(10 <= day % 100 && day % 100 <= 20)) {
      if (day % 10 === 1) suffix = 'st';
      else if (day % 10 === 2) suffix = 'nd';
      else if (day % 10 === 3) suffix = 'rd';
    }
    
    return `${day}${suffix}_${month}`;
  };

  // Convert date string like "6th_May" to comparable date
  const parseDateStr = (dateStr) => {
    if (!dateStr) return null;
    const [dayPart, monthPart] = dateStr.split('_');
    const day = parseInt(dayPart.replace(/st|nd|rd|th/, ''), 10);
    const year = new Date().getFullYear();
    return new Date(`${monthPart} ${day}, ${year}`);
  };

  // Check if date is within last 7 days
  const isWithinLast7Days = (dateStr) => {
    const date = parseDateStr(dateStr);
    if (!date) return false;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return date >= sevenDaysAgo && date <= now;
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/episodes?limit=999`);
        const json = await res.json();
        // Filter: only last 7 days
        let filtered = (json.episodes || [])
          .filter(ep => isWithinLast7Days(ep.date_str));
        // Sort by date descending (latest first)
        filtered.sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateB - dateA;
        });
        // Format for ticker
        const tickerItems = filtered.map(ep => ({
          ep: `EP ${String(ep.num).padStart(3, '0')}`,
          title: ep.headline.split(',')[0],
        }));
        setItems(tickerItems);
      } catch (err) {
        console.error('Failed to fetch ticker episodes', err);
      }
    })();
  }, []);
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
