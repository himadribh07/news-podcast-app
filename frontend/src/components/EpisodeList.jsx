import React, { useEffect, useState, useContext, useRef } from 'react';
import API_BASE_URL from '../utils/apiConfig';
import { AudioContext } from '../context/AudioContext';
import ArrowIcon from './ArrowIcon';

export default function EpisodeList({
  eyebrow = '◇ Recent episodes',
  title,
  onViewAll,
}) {
  const audio = useContext(AudioContext);
  const audioRef = useRef(null);  // Local audio element for past episodes
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingEpisodeDateStr, setPlayingEpisodeDateStr] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
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

    // Initialize local audio element for past episodes
    audioRef.current = new Audio();
    audioRef.current.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Pause local audio if today's episode (shared audio) starts playing
  useEffect(() => {
    if (audio?.playing && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [audio?.playing]);

  const handlePlay = (ep) => {
    // Pause today's episode if it's playing
    if (audio?.playing) audio.pause();

    // If already playing this episode
    if (playingEpisodeDateStr === ep.date_str) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }
    // Load new episode
    audioRef.current.src = ep.audio_url;
    audioRef.current.play();
    setPlayingEpisodeDateStr(ep.date_str);
    setIsPlaying(true);
  };

  const handleShowTranscript = async (ep) => {
    try {
      const res = await fetch(`${API_BASE_URL}/transcript/${ep.date_str}`);
      const data = await res.json();
      setTranscriptData({ ...data, date_str: ep.date_str, num: ep.num });
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
    <section className="sig-section" id="episodes">
      <div className="sig-wrap">
        <div className="sig-section__head">
          <div>
            <div className="sig-eyebrow">{eyebrow}</div>
            <h2 className="sig-section__title">{title ?? defaultTitle}</h2>
          </div>
          {onViewAll && (
            <button className="sig-btn sig-btn--viewall" onClick={onViewAll}>
              <span>View all</span>
              <ArrowIcon direction="right" size={18} />
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </button>
              <button
                className="sig-eprow__play"
                onClick={() => handlePlay(ep)}
                aria-label={`Play episode ${ep.num}`}
              >
                {playingEpisodeDateStr === ep.date_str && isPlaying ? (
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
        .sig-btn--viewall {
          display: inline-flex;
          align-items: center;
          gap: 10px;
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
        .sig-eprow__transcript {
          color: var(--fg-dim);
        }
        .sig-eprow:hover .sig-eprow__transcript {
          color: var(--accent);
          border-color: var(--accent);
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
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 32px;
          max-width: 700px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }
        .sig-transcript-modal__close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--fg-faint);
          transition: color 0.2s;
          padding: 0;
        }
        .sig-transcript-modal__close:hover {
          color: var(--fg);
        }
        .sig-transcript-modal__content h2 {
          font-family: var(--sans);
          font-size: 14px;
          font-weight: 500;
          color: var(--fg-faint);
          margin: 0 0 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding-right: 32px;
        }
        .sig-transcript-modal__headline {
          font-family: var(--sans);
          font-size: 22px;
          font-weight: 500;
          color: var(--fg);
          margin: 0 0 24px;
          line-height: 1.3;
        }
        .sig-transcript-modal__body {
          font-family: var(--serif);
          font-size: 16px;
          line-height: 1.8;
          color: var(--fg);
          white-space: pre-wrap;
          word-wrap: break-word;
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
            <h2>Episode {String(transcriptData?.num).padStart(3, '0')} · {transcriptData?.date_str.replace('_', ' ')}</h2>
            <h3 className="sig-transcript-modal__headline">{transcriptData?.headline}</h3>
            <div className="sig-transcript-modal__body">
              {transcriptData?.script}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}