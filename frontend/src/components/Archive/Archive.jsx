import React, { useEffect, useState, useRef, useContext } from 'react';
import API_BASE_URL from '../../utils/apiConfig';
import { AudioContext } from '../../context/AudioContext';
import ArrowIcon from '../ArrowIcon';
import './Archive.css';

export default function Archive({ onClose }) {
  const audio = useContext(AudioContext);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef(null);
  const [playingDateStr, setPlayingDateStr] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptData, setTranscriptData] = useState(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);

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

  const parseDateStr = (dateStr) => {
    if (!dateStr) return null;
    const [dayPart, monthPart] = dateStr.split('_');
    const day = parseInt(dayPart.replace(/st|nd|rd|th/, ''), 10);
    const year = new Date().getFullYear();
    return new Date(`${monthPart} ${day}, ${year}`);
  };

  const isWithinLast14Days = (dateStr) => {
    const date = parseDateStr(dateStr);
    if (!date) return false;
    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    return date >= fourteenDaysAgo && date <= now;
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/episodes?limit=999`);
        const json = await res.json();
        const filtered = (json.episodes || [])
          .filter(ep => ep.date_str !== todayDateStr && isWithinLast14Days(ep.date_str));
        filtered.sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateB - dateA;
        });
        setEpisodes(filtered);
      } catch (err) {
        console.error('Failed to fetch archive', err);
      } finally {
        setLoading(false);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    })();

    audioRef.current = new Audio();
    audioRef.current.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audio?.playing && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [audio?.playing]);

  const handlePlay = (ep) => {
    if (audio?.playing) audio.pause();

    if (playingDateStr === ep.date_str) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    audioRef.current.src = ep.audio_url;
    audioRef.current.play();
    setPlayingDateStr(ep.date_str);
    setIsPlaying(true);
  };

  const handleShowTranscript = async (ep, e) => {
    e.stopPropagation();
    setTranscriptLoading(true);
    setShowTranscript(true);
    try {
      const res = await fetch(`${API_BASE_URL}/transcript/${ep.date_str}`);
      if (!res.ok) {
        setTranscriptLoading(false);
        return;
      }
      const data = await res.json();
      setTranscriptData({ ...data, date_str: ep.date_str, num: ep.num });
    } catch (err) {
      console.error(err);
    } finally {
      setTranscriptLoading(false);
    }
  };

  return (
    <section className="sig-archive">
      <div className="sig-wrap">
        <div className="sig-archive__head">
          <button className="sig-btn sig-btn--back" onClick={onClose}>
            <ArrowIcon direction="left" size={18} className="sig-arrow-icon--left" />
            <span>Back</span>
          </button>
          <div>
            <div className="sig-eyebrow">◇ Last 14 Days</div>
            <h2 className="sig-archive__title">Recent <span className="sig-it">episodes</span>.</h2>
          </div>
          <div />
        </div>

        {loading ? (
          <div className="sig-archive__empty">Loading…</div>
        ) : episodes.length === 0 ? (
          <div className="sig-archive__empty">No episodes yet.</div>
        ) : (
          <div className="sig-eplist">
            {episodes.map((ep) => {
              const isThisPlaying = playingDateStr === ep.date_str && isPlaying;
              return (
                <div key={ep.date_str} className="sig-eprow" onClick={() => handlePlay(ep)}>
                  <div className="sig-eprow__num">{String(ep.num).padStart(3, '0')}</div>
                  <div className="sig-eprow__title">
                    <h3>{ep.headline}</h3>
                    <p className="sig-eprow__desc">{ep.description}</p>
                  </div>
                  <div className="sig-eprow__date">{ep.date_str.replace('_', ' ')}</div>
                  <div className="sig-eprow__dur">{ep.totalTime}</div>
                  <div className="sig-eprow__actions">
                    <button className="sig-eprow__bubble" onClick={(e) => handleShowTranscript(ep, e)} title="Transcript">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                    </button>
                    <button className="sig-eprow__play" onClick={(e) => { e.stopPropagation(); handlePlay(ep); }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                        {isThisPlaying ? (
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        ) : (
                          <path d="M8 5v14l11-7z" />
                        )}
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showTranscript && (
        <div className="sig-transcript-modal" onClick={() => setShowTranscript(false)}>
          <div className="sig-transcript-modal__content" onClick={(e) => e.stopPropagation()}>
            <button className="sig-transcript-modal__close" onClick={() => setShowTranscript(false)}>✕</button>
            {transcriptLoading ? (
              <p>Loading transcript…</p>
            ) : transcriptData ? (
              <>
                <h2>Episode {String(transcriptData.num).padStart(3, '0')} · {transcriptData.date_str.replace('_', ' ')}</h2>
                <h3 className="sig-transcript-modal__headline">{transcriptData.headline}</h3>
                <div className="sig-transcript-modal__body">{transcriptData.script}</div>
              </>
            ) : (
              <p>Transcript unavailable.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}