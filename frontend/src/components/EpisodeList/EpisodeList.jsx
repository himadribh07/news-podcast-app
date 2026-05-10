import React, { useEffect, useState, useContext, useRef } from 'react';
import API_BASE_URL from '../../utils/apiConfig';
import { AudioContext } from '../../context/AudioContext';
import ArrowIcon from '../ArrowIcon';
import '../Archive/Archive.css';

export default function EpisodeList({
  eyebrow = '◇ Recent episodes',
  title,
  onViewAll,
}) {
  const audio = useContext(AudioContext);
  const audioRef = useRef(null);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingEpisodeDateStr, setPlayingEpisodeDateStr] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptData, setTranscriptData] = useState(null);

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
        let pastEpisodes = (json.episodes || [])
          .filter(ep => ep.date_str !== todayDateStr)
          .sort((a, b) => Number(b.num) - Number(a.num))
          .slice(0, 7);
        setEpisodes(pastEpisodes);
      } catch (err) {
        console.error('Failed to fetch episodes', err);
      } finally {
        setLoading(false);
      }

      audioRef.current = new Audio();
      audioRef.current.addEventListener('ended', () => setIsPlaying(false));

      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
      };
    })();
  }, []);

  useEffect(() => {
    if (audio?.playing && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [audio?.playing]);

  const handlePlay = (ep) => {
    if (audio?.playing) audio.pause();

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
          <div className="sig-eplist-empty">Past episodes will appear here from tomorrow.</div>
        </div>
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
              <div className="sig-eprow__actions">
                <button className="sig-eprow__bubble" onClick={() => handleShowTranscript(ep)} title="View transcript">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </button>
                <button className="sig-eprow__play" onClick={() => handlePlay(ep)} aria-label={`Play episode ${ep.num}`}>
                  {playingEpisodeDateStr === ep.date_str && isPlaying ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showTranscript && (
        <div className="sig-transcript-modal" onClick={() => setShowTranscript(false)}>
          <div className="sig-transcript-modal__content" onClick={(e) => e.stopPropagation()}>
            <button className="sig-transcript-modal__close" onClick={() => setShowTranscript(false)}>✕</button>
            <h2>Episode {String(transcriptData?.num).padStart(3, '0')} · {transcriptData?.date_str.replace('_', ' ')}</h2>
            <h3 className="sig-transcript-modal__headline">{transcriptData?.headline}</h3>
            <div className="sig-transcript-modal__body">{transcriptData?.script}</div>
          </div>
        </div>
      )}
    </section>
  );
}