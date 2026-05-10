import React, { useEffect, useState } from 'react';
import API_BASE_URL from '../../utils/apiConfig';
import './Ticker.css';

export default function Ticker({ speed = 60 }) {
  const [items, setItems] = useState([]);

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

  const parseDateStr = (dateStr) => {
    if (!dateStr) return null;
    const [dayPart, monthPart] = dateStr.split('_');
    const day = parseInt(dayPart.replace(/st|nd|rd|th/, ''), 10);
    const year = new Date().getFullYear();
    return new Date(`${monthPart} ${day}, ${year}`);
  };

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
        let filtered = (json.episodes || []).filter(ep => isWithinLast7Days(ep.date_str));
        filtered.sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateB - dateA;
        });
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

  const loop = [...items, ...items];

  return (
    <div className="sig-ticker">
      <div className="sig-ticker__track" style={{ animationDuration: `${speed}s` }}>
        {loop.map((it, i) => (
          <span key={i} className="sig-ticker__item">
            <span className="sig-ticker__ep">{it.ep}</span>
            <span>{it.title}</span>
            <span className="sig-ticker__dot" />
          </span>
        ))}
      </div>
    </div>
  );
}