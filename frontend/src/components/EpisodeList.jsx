import React, { useEffect, useState, useContext } from 'react';
import API_BASE_URL from '../utils/apiConfig';
import { AudioContext } from '../context/AudioContext';

export default function EpisodeList({
  eyebrow = '◇ Recent episodes',
  title,
  onViewAll,
}) {
  const audio = useContext(AudioContext);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingEpisodeDateStr, setPlayingEpisodeDateStr] = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptData, setTranscriptData] = useState(null);

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

  const todayDateStr = getTodayDateStr();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/episodes`);
        const json = await res.json();
        // Filter out today's episode
        let pastEpisodes = (json.episodes || []).filter(ep => ep.date_str !== todayDateStr);
        // Sort by date descending (latest first) for UI display
        pastEpisodes.sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateB - dateA;
        });
        setEpisodes(pastEpisodes);
      } catch (err) {
        console.error('Failed to fetch episodes', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handlePlay = (ep) => {
    // If already playing this episode
    if (playingEpisodeDateStr === ep.date_str && audio.playing) {
      audio.pause();
      return;
    }
    // If this episode is loaded but paused
    if (playingEpisodeDateStr === ep.date_str && !audio.playing) {
      audio.play();
      return;
    }
    // Load new episode
    audio.setAudioSource(ep.audio_url);
    audio.setTotalTime(ep.totalTime);
    setPlayingEpisodeDateStr(ep.date_str);
    audio.play();
  };

  const handleShowTranscript = async (ep) => {
    try {
      const res = await fetch(`${API_BASE_URL}/transcript/${ep.date_str}`);
      const data = await res.json();
      setTranscriptData(data);
      setShowTranscript(true);
    } catch (err) {
      console.error('Failed to fetch transcript', err);
      alert('Could not load transcript');
    }
  };

  const defaultTitle = (
    <>The last <span className="sig-it">weeks</span>, indexed.</>
  );

  // Empty state — today is episode 1, no past episodes yet
  if (!loading && episodes.length === 0) {
    return (
      <section className="sig-section">
        <div className="sig-wrap">
          <div className="sig-section__head">
            <div>
              <div className="sig-eyebrow">{eyebrow}</div>
              <h2 className="sig-section__title">{title ?? defaultTitle}</h2>
            </div>
          </div>
          <div className="sig-eplist-empty">
            Past episodes will appear here from tomorrow.
          </div>
        </div>
        <style>{`
          .sig-eplist-empty {
            padding: 48px 0;
            text-align: center;
            font-family: var(--mono); font-size: 12px;
            color: var(--fg-faint); letter-spacing: 0.08em;
            text-transform: uppercase;
            border-top: 1px solid var(--line);
            border-bottom: 1px solid var(--line);
          }
        `}</style>
      </section>
    );
  }

  return (
    <section className="sig-section">
      <div className="sig-wrap">
        <div className="sig-section__head">
          <div>
            <div className="sig-eyebrow">{eyebrow}</div>
            <h2 className="sig-section__title">{title ?? defaultTitle}</h2>
          </div>
          {onViewAll && (
            <button className="sig-btn" onClick={onViewAll}>
              View all →
            </button>
          )}
        </div>

        <div className="sig-eplist">
          {episodes.map((ep) => (
            <div key={ep.date_str} className="sig-eprow">
              <div className="sig-eprow__num">{String(ep.num).padStart(3, '0')}</div>
              <div className="sig-eprow__title">
                <h3>{ep.headline}</h3>
                <p className="sig-eprow__desc">{ep.description}</p>
              </div>
              <div className="sig-eprow__date">{ep.date_str.replace('_', ' ')}</div>
              <div className="sig-eprow__dur">{ep.totalTime}</div>
              <button
                className="sig-eprow__transcript"
                onClick={() => handleShowTranscript(ep)}
                title="View transcript"
              >
                📄
              </button>
              <button
                className="sig-eprow__play"
                onClick={() => handlePlay(ep)}
                aria-label={`Play episode ${ep.num}`}
              >
                {playingEpisodeDateStr === ep.date_str && audio.playing ? (
                  // Pause icon
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  // Play icon
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .sig-eplist { border-top: 1px solid var(--line); }
        .sig-eprow {
          display: grid;
          grid-template-columns: 60px 1fr 140px 80px 40px 50px;
          align-items: center;
          gap: 16px;
          padding: 22px 0;
          border-bottom: 1px solid var(--line);
          transition: background 0.15s;
        }
        .sig-eprow:hover { background: oklch(0.19 0.01 60 / 0.5); }
        .sig-eprow:hover .sig-eprow__play,
        .sig-eprow:hover .sig-eprow__transcript {
          background: var(--accent); color: var(--bg);
        }
        .sig-eprow__num {
          font-family: var(--mono); font-size: 12px;
          color: var(--fg-faint);
        }
        .sig-eprow__title h3 {
          font-size: 17px; font-weight: 500; margin: 0 0 6px;
          letter-spacing: -0.015em; color: var(--fg);
        }
        .sig-eprow__desc {
          font-size: 13px; color: var(--fg-dim);
          margin: 0; line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .sig-eprow__date, .sig-eprow__dur {
          font-family: var(--mono); font-size: 12px;
          color: var(--fg-faint);
        }
        .sig-eprow__dur { text-align: right; }
        .sig-eprow__play, .sig-eprow__transcript {
          width: 36px; height: 36px; border-radius: 50%;
          border: 1px solid var(--line-2);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
          justify-self: end;
          color: var(--fg);
          background: none;
          cursor: pointer;
          font-size: 16px;
        }

        .sig-transcript-modal {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .sig-transcript-modal__content {
          background: var(--bg);
          border-radius: 8px;
          padding: 32px;
          max-width: 700px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }
        .sig-transcript-modal__close {
          float: right;
          font-size: 24px;
          cursor: pointer;
          color: var(--fg-dim);
          background: none;
          border: none;
          padding: 0;
        }
        .sig-transcript-modal__close:hover {
          color: var(--fg);
        }
        .sig-transcript-modal h2 {
          margin-top: 0;
          color: var(--fg);
          font-size: 22px;
        }
        .sig-transcript-modal p {
          color: var(--fg-dim);
          line-height: 1.6;
          margin: 16px 0;
        }

        @media (max-width: 900px) {
          .sig-eprow {
            grid-template-columns: 40px 1fr 40px 50px;
            gap: 12px;
          }
          .sig-eprow__date, .sig-eprow__dur { display: none; }
        }
      `}</style>

      {showTranscript && (
        <div className="sig-transcript-modal" onClick={() => setShowTranscript(false)}>
          <div className="sig-transcript-modal__content" onClick={(e) => e.stopPropagation()}>
            <button
              className="sig-transcript-modal__close"
              onClick={() => setShowTranscript(false)}
            >
              ✕
            </button>
            <h2>{transcriptData?.headline || 'Transcript'}</h2>
            <div>
              {transcriptData?.description && (
                <p><strong>Summary:</strong> {transcriptData.description}</p>
              )}
              {transcriptData?.script && (
                <div>
                  <strong>Full Transcript:</strong>
                  <p style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--mono)', fontSize: '13px' }}>
                    {transcriptData.script}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}