import React, { useMemo, useState, useContext, useEffect } from 'react';
import { formatReleasedAt } from '../utils/formatDate';
import { formatTimeDisplay, getFormattedDate, transcriptFormattedDate, calculateProgress, convertToMinFormat, getEpisodeNumber, getEpisodeEyebrow } from '../utils/timeUtils';
import { AudioContext } from '../context/AudioContext';
/**
 * Big "today's episode" hero card with placeholder cover art + waveform.
 * Fetches audio and transcript data from backend API.
 *
 * Props:
 *   epNumber       number/string  shown in the cover art
 *   eyebrow        string         section eyebrow
 *   sectionTitle   string         custom section title
 *   releasedAt     string         shown top-right of the section head
 *   isNew          bool           show "● New" indicator
 *   show           string         e.g. "Morning Briefing"
 *   title          node           feature title — wrap italic words in <em>
 *   description    string         episode description
 */
export default function FeaturedEpisode({
  epNumber: propEpisodeNumber,
  eyebrow: propEyebrow,
  sectionTitle,
  releasedAt,
  isNew       = true,
  show        = 'Morning Briefing',
  title,
  description = "Host Mara Okafor walks through rate-cut expectations, the quiet AI bill that moved out of committee last night, and why this month's census numbers are about to reshape three congressional districts — plus four more stories in under twenty minutes.",
}) {
  const audio = useContext(AudioContext);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [epNumber, setEpNumber] = useState(1);
  const [eyebrow, setEyebrow] = useState('◇ Featured · Episode 1');

  // Fetch episode number from backend on mount
  useEffect(() => {
    (async () => {
      const episodeNum = await getEpisodeNumber();
      const eyebrowText = await getEpisodeEyebrow();
      setEpNumber(episodeNum);
      setEyebrow(eyebrowText);
    })();
  }, []);

  const displayReleasedAt = releasedAt ?? formatReleasedAt();
  const displayTotalTime = audio.totalTime ?? '--:--';

  const displayCurrentTime = formatTimeDisplay(audio.currentTime);
  const dynamicProgress = calculateProgress(audio.currentTime, audio.duration);

  const handlePlayClick = async () => {
    if (audio.playing) {
      // Already playing, just toggle pause
      audio.togglePlayPause();
    } else if (audio.audioRef.current?.src) {
      // Audio source exists but not playing, play it
      audio.play();
    } else {
      // Need to fetch audio first
      setIsLoading(true);
      try {
        const res = await fetch('http://localhost:8000/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ genres: null, states: null }),
        });
        if (!res.ok) {
          console.error('Generate request failed', await res.text());
          setIsLoading(false);
          return;
        }
        const json = await res.json();
        const audioRes = await fetch(`http://localhost:8000${json.audio_url}`);
        if (!audioRes.ok) {
          console.error('Failed to fetch audio', await audioRes.text());
          setIsLoading(false);
          return;
        }
        const blob = await audioRes.blob();
        const url = URL.createObjectURL(blob);
        console.log('API Response totalTime:', json.totalTime);
        const convertedDuration = convertToMinFormat(json.totalTime);
        console.log('Converted duration:', convertedDuration);

        // Set the shared audio source and play
        audio.setAudioSource(url);
        audio.setTotalTime(json.totalTime);
        audio.play();
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleShowTranscript = async () => {
    if (transcript) {
      setShowTranscript(true);
      return;
    }

    setTranscriptLoading(true);
    try {
      const dateStr = getFormattedDate();
      const res = await fetch(`http://localhost:8000/transcript/${dateStr}`);
      if (!res.ok) {
        console.error('Failed to fetch transcript');
        setTranscriptLoading(false);
        return;
      }
      const data = await res.json();
      setTranscript(data);
      setShowTranscript(true);
    } catch (err) {
      console.error(err);
    } finally {
      setTranscriptLoading(false);
    }
  };
  const defaultTitle = (
    <>Markets brace for the Fed, and the <em>real</em> story behind the census release.</>
  );
  const defaultSectionTitle = (
    <>Today in <span className="sig-it">seven stories</span>.</>
  );

  // deterministic waveform bars
  const bars = useMemo(() => {
    const N = 80;
    const arr = [];
    for (let i = 0; i < N; i++) {
      const h = 18 + Math.abs(Math.sin(i * 0.37) * 14 + Math.cos(i * 0.21) * 10) + (i % 7) * 1.2;
      arr.push(Math.min(h, 46));
    }
    return arr;
  }, []);
  const playedTo = Math.round(bars.length * dynamicProgress);

  return (
    <section className="sig-section">
      <div className="sig-wrap">
        <div className="sig-section__head">
          <div>
            <div className="sig-eyebrow">{eyebrow}</div>
            <h2 className="sig-section__title">{sectionTitle ?? defaultSectionTitle}</h2>
          </div>
          <div className="sig-feat__released">{displayReleasedAt}</div>
        </div>

        <div className="sig-feat">
          <div className="sig-feat__art">
            <div className="sig-feat__epnum">EP / {epNumber}</div>
            <div className="sig-feat__hugenum">{epNumber}</div>
            <button 
              className="sig-feat__play" 
              aria-label={isLoading ? "Loading" : audio.playing ? "Pause" : "Play"} 
              onClick={handlePlayClick}
              disabled={isLoading}
            >
              {isLoading ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="loading-spinner">
                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                  <path d="M12 2 A10 10 0 0 1 22 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : audio.playing ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <div className="sig-feat__artlabel">cover · episode art</div>
          </div>

          <div>
            <div className="sig-feat__meta">
              {isNew && <><span style={{ color: 'var(--accent)' }}>●</span> New <span className="sig-feat__sep">·</span></>}
              <span>{show}</span>
              <span className="sig-feat__sep">·</span>
              <span>{convertToMinFormat(audio.totalTime)}</span>
            </div>

            <h3 className="sig-feat__title">{title ?? defaultTitle}</h3>
            <p className="sig-feat__desc">{description}</p>

            <div className="sig-feat__wave">
              {bars.map((h, i) => (
                <span
                  key={i}
                  className={i < playedTo ? 'played' : ''}
                  style={{ height: h + 'px' }}
                />
              ))}
            </div>
            <div className="sig-feat__time">
              <span>{displayCurrentTime}</span>
              <span>{displayTotalTime}</span>
            </div>

            <div className="sig-feat__actions">
              <button className="sig-btn sig-btn--primary" onClick={handlePlayClick} disabled={isLoading}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  {audio.playing ? (
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  ) : (
                    <path d="M8 5v14l11-7z" />
                  )}
                </svg>
                {isLoading ? 'Loading...' : audio.playing ? 'Pause' : 'Play episode'}
              </button>
              <button className="sig-btn" onClick={handleShowTranscript} disabled={transcriptLoading}>
                {transcriptLoading ? 'Loading...' : 'Show Transcript'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showTranscript && (
        <div className="sig-transcript-modal" onClick={() => setShowTranscript(false)}>
          <div className="sig-transcript-modal__content" onClick={(e) => e.stopPropagation()}>
            <button className="sig-transcript-modal__close" onClick={() => setShowTranscript(false)}>✕</button>
            <h2>Transcript · {transcriptFormattedDate()}</h2>
            {transcript && (
              <div className="sig-transcript-modal__body">
                <p>{transcript.script}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .sig-feat {
          display: grid; grid-template-columns: 1.1fr 1fr;
          gap: 60px; align-items: center;
        }
        .sig-feat__released {
          font-family: var(--mono); font-size: 11px;
          color: var(--fg-faint); letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .sig-feat__art {
          aspect-ratio: 4/5;
          background: linear-gradient(135deg, var(--bg-2), var(--bg-3));
          border: 1px solid var(--line);
          border-radius: 14px;
          position: relative;
          overflow: hidden;
        }
        .sig-feat__art::before {
          content: ""; position: absolute; inset: 0;
          background-image:
            repeating-linear-gradient(45deg, transparent 0 10px, oklch(0.3 0.012 60 / 0.35) 10px 11px);
        }
        .sig-feat__epnum {
          position: absolute; top: 20px; left: 20px;
          font-family: var(--mono); font-size: 11px;
          color: var(--fg-dim); letter-spacing: 0.08em;
        }
        .sig-feat__artlabel {
          position: absolute; bottom: 20px; left: 20px;
          font-family: var(--mono); font-size: 11px;
          color: var(--fg-faint); letter-spacing: 0.05em;
        }
        .sig-feat__hugenum {
          position: absolute; bottom: 0; right: 0;
          font-family: var(--serif); font-style: italic;
          font-size: 320px; line-height: 0.85;
          color: oklch(0.78 0.14 65 / 0.08);
          pointer-events: none;
        }
        .sig-feat__play {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 88px; height: 88px; border-radius: 50%;
          background: var(--fg);
          color: var(--bg);
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.2s, background 0.2s;
          border: none; cursor: pointer;
        }
        .sig-feat__play:disabled {
          opacity: 0.7; cursor: not-allowed;
        }
        .sig-feat__play:not(:disabled):hover {
          background: var(--accent);
          transform: translate(-50%, -50%) scale(1.06);
        }
        .sig-feat__play svg { margin-left: 4px; }
        .sig-feat__play .loading-spinner {
          animation: spin 1s linear infinite;
          margin-left: 0;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .sig-feat__meta {
          display: flex; gap: 12px; align-items: center;
          font-family: var(--mono); font-size: 11px;
          color: var(--fg-faint); letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 20px;
        }
        .sig-feat__sep { color: var(--fg-faint); }
        .sig-feat__title {
          font-family: var(--sans);
          font-size: clamp(30px, 3.5vw, 44px);
          line-height: 1.05; letter-spacing: -0.025em;
          font-weight: 500; margin: 0 0 20px;
          text-wrap: balance;
        }
        .sig-feat__title em {
          font-family: var(--serif); font-style: italic; font-weight: 400;
          color: var(--accent);
        }
        .sig-feat__desc {
          color: var(--fg-dim); line-height: 1.6; font-size: 16px;
          margin-bottom: 32px;
        }
        .sig-feat__wave {
          display: flex; align-items: end; gap: 3px;
          height: 48px; margin-bottom: 12px;
        }
        .sig-feat__wave span {
          flex: 1; background: var(--fg-faint); border-radius: 2px;
          transition: background 0.2s;
        }
        .sig-feat__wave span.played { background: var(--accent); }
        .sig-feat__wave:hover span { background: var(--fg-dim); }
        .sig-feat__wave:hover span.played { background: var(--accent); }
        .sig-feat__time {
          display: flex; justify-content: space-between;
          font-family: var(--mono); font-size: 11px;
          color: var(--fg-faint); margin-bottom: 32px;
        }
        .sig-feat__actions { display: flex; gap: 10px; flex-wrap: wrap; }

        .sig-transcript-modal {
          position: fixed; inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000;
        }
        .sig-transcript-modal__content {
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 32px;
          max-width: 700px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          position: relative;
        }
        .sig-transcript-modal__close {
          position: absolute; top: 16px; right: 16px;
          background: none; border: none;
          font-size: 24px; cursor: pointer;
          color: var(--fg-faint);
          transition: color 0.2s;
        }
        .sig-transcript-modal__close:hover {
          color: var(--fg);
        }
        .sig-transcript-modal__content h2 {
          font-family: var(--sans);
          font-size: 24px; font-weight: 500;
          margin: 0 0 20px;
          padding-right: 32px;
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
          .sig-feat { grid-template-columns: 1fr; gap: 40px; }
          .sig-feat__hugenum { font-size: 220px; }
          .sig-transcript-modal__content {
            padding: 20px;
          }
        }
      `}</style>
    </section>
  );
}
