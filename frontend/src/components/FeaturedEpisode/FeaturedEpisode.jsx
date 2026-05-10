import React, { useMemo, useState, useContext, useEffect } from 'react';
import { formatReleasedAt } from '../../utils/formatDate';
import { formatTimeDisplay, getFormattedDate, transcriptFormattedDate, calculateProgress, convertToMinFormat, getEpisodeNumber, getEpisodeEyebrow } from '../../utils/timeUtils';
import { AudioContext } from '../../context/AudioContext';
import API_BASE_URL from '../../utils/apiConfig';
import { highlightRandomWords } from '../../utils/highlightWords';
import './FeaturedEpisode.css';
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
  description = "",
}) {
  const audio = useContext(AudioContext);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [epNumber, setEpNumber] = useState(1);
  const [eyebrow, setEyebrow] = useState('◇ Featured · Episode 1');

  useEffect(() => {
    (async () => {
      const episodeNum = await getEpisodeNumber();
      const eyebrowText = await getEpisodeEyebrow();
      setEpNumber(episodeNum);
      setEyebrow(eyebrowText);
    })();
  }, [audio.totalTime]);  // re-run when API returns fresh data

  const displayReleasedAt = releasedAt ?? formatReleasedAt();
  const displayTotalTime = audio.totalTime ?? '--:--';

  const displayCurrentTime = formatTimeDisplay(audio.currentTime);
  const dynamicProgress = calculateProgress(audio.currentTime, audio.duration);

  // Precompute highlighted text with hooks (must be unconditional)
  const highlightedDescription = useMemo(() => {
    return description ? highlightRandomWords(description, { count: 3 }) : null;
  }, [description]);

  const highlightedTranscript = useMemo(() => {
    if (!transcript) return null;
    return highlightRandomWords(transcript.script || '', { count: 8 });
  }, [transcript]);

  const trimmedTitle = useMemo(() => {
    if (typeof title !== 'string') return title;
    // Take everything up to and including first full stop
    const idx = title.indexOf('.');
    return idx === -1 ? title : title.slice(0, idx + 1);
  }, [title]);

  const highlightedTitle = useMemo(() => {
    return typeof trimmedTitle === 'string' ? highlightRandomWords(trimmedTitle, { count: 3 }) : null;
  }, [trimmedTitle]);

  const handlePlayClick = async () => {
    if (audio.playing) {
      // Already playing, just toggle pause
      audio.togglePlayPause();
    } else if (audio.audioRef.current?.src) {
      // Audio source exists but not playing, play it
      audio.play();
    } else {
      // Need to fetch audio first
      if (audio.isGenerating) return;
      setIsLoading(true);
      try {
        await audio.runGenerate(async () => {
          const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
          const attemptGenerate = async (attempt = 1) => {
            const res = await fetch(`${API_BASE_URL}/generate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ genres: null, states: null, date: getFormattedDate() }),
            });
            if (res.ok) return await res.json();
            let body = null;
            try { body = await res.json(); } catch (e) { body = null; }
            console.warn('Generate request failed', res.status, body || await res.text().catch(() => ''));
            if (body && body.detail && body.detail.includes('RESOURCE_EXHAUSTED') && attempt < 2) {
              const rd = body?.details?.find(d => d['@type'] && d['@type'].includes('RetryInfo'))?.retryDelay;
              let ms = 5000;
              if (rd && typeof rd === 'string') {
                const m = rd.match(/([0-9.]+)s/);
                if (m) ms = Math.max(1000, Math.floor(parseFloat(m[1]) * 1000));
              }
              await sleep(ms + 200);
              return attemptGenerate(attempt + 1);
            }
            if (body && body.detail && body.detail.includes('RESOURCE_EXHAUSTED')) {
              alert('Service temporarily unavailable: model quota exceeded. Please try again later.');
            }
            return null;
          };

          const json = await attemptGenerate();
          if (!json) return null;
          const audioRes = await fetch(`${API_BASE_URL}${json.audio_url}`);
          if (!audioRes.ok) {
            console.error('Failed to fetch audio', await audioRes.text());
            return null;
          }
          const blob = await audioRes.blob();
          const url = URL.createObjectURL(blob);
          console.log('API Response totalTime:', json.totalTime);
          const convertedDuration = convertToMinFormat(json.totalTime);
          console.log('Converted duration:', convertedDuration);

          // Set the shared audio source and play
          audio.setAudioSource(url);
          audio.setTotalTime(json.totalTime);
          audio.setHeadline(json.headline ?? '');
          audio.setDescription(json.description ?? '');
          audio.play();
          return json;
        });
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
      const res = await fetch(`${API_BASE_URL}/transcript/${dateStr}`);
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
  const defaultTitle = <>Today's top stories.</>;
  const defaultSectionTitle = (
    <>Today in <span className="sig-it">major updates</span>.</>
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
    <section className="sig-section" id="featured-episode">
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

            <h3 className="sig-feat__title">{highlightedTitle || title || defaultTitle}</h3>
            <p className="sig-feat__desc">
              {highlightedDescription || "Today's headlines distilled into a quick listen."}
            </p>

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
              <button className="sig-btn sig-btn--primary" onClick={handlePlayClick} disabled={isLoading || audio.isGenerating}>
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
                <p>{highlightedTranscript}</p>
              </div>
            )}
          </div>
        </div>
      )}

    </section>
  );
}
