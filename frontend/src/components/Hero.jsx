import React, { useContext, useState, useMemo } from 'react';
import { formatEyebrowDate } from '../utils/formatDate';
import { AudioContext } from '../context/AudioContext';
import API_BASE_URL from '../utils/apiConfig';
import { highlightRandomWords } from '../utils/highlightWords';
import ArrowIcon from './ArrowIcon';

export default function Hero({
  eyebrowDate,
  totalTime,   
  playing = false,                 //"MM:SS" from API
  live = true,
  headline,
  thesisTag = '[thesis]',
  thesisText = 'top stories. one host. under ten minutes. before your coffee cools.',
  sub = 'Signal is a daily news for people who want to stay informed without drowning. Every morning we pick stories that matter, explain them in plain language, and skip the rest.',
  secondaryLabel = 'Browse the archive',
  onPrimary,
  onSecondary,
}) {
  const audio = useContext(AudioContext);
  const [isLoading, setIsLoading] = useState(false);
  const displayEyebrowDate = eyebrowDate ?? formatEyebrowDate();
  // Precompute highlighted headline to keep hooks stable
  const highlightedHeadline = useMemo(() => {
    return typeof headline === 'string' ? highlightRandomWords(headline, { count: 3 }) : null;
  }, [headline]);

  const handlePlayClick = async () => {
    if (audio.playing) {
      audio.togglePlayPause();
      return;
    }

    if (audio.audioRef.current?.src) {
      audio.play();
      return;
    }

    // Prevent multiple concurrent generate calls across the app.
    if (audio.isGenerating) return;

    setIsLoading(true);
    try {
      await audio.runGenerate(async () => {
        const res = await fetch(`${API_BASE_URL}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        if (!res.ok) {
          console.error('Generate failed', await res.text());
          return null;
        }
        const json = await res.json();
        console.log('API totalTime:', json.totalTime);

        audio.setAudioSource(`${API_BASE_URL}${json.audio_url}`);
        audio.setTotalTime(json.totalTime ?? '--:--');
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
  };

  // derive pill duration ("18 min") from totalTime ("18:04")
  const eyebrowDuration = totalTime
    ? `${parseInt(totalTime.split(':')[0], 10)} min`
    : '-- min';

  const defaultHeadline = (
    <>The news that <span className="sig-it">matters</span>. Nothing that doesn't.</>
  );

  return (
    <section className="sig-hero">
      <div className="sig-wrap">
        <div className="sig-hero__pills">
          {live && (
            <span className="sig-pill sig-pill--accent">
              <span className="sig-pill__dot sig-pill__dot--live" />
              Today's Briefing · Live
            </span>
          )}
          <span className="sig-pill">{displayEyebrowDate}</span>
          <span className="sig-pill">{eyebrowDuration}</span>
        </div>

        <h1 className="sig-hero__headline">
          {highlightedHeadline || (headline ?? defaultHeadline)}
        </h1>

        <div className="sig-hero__thesis">
          <span className="sig-hero__thesis-tag">{thesisTag}</span>
          <span>{thesisText}</span>
        </div>

        <p className="sig-hero__sub">{sub}</p>

        <div className="sig-hero__ctas">
          <button className="sig-btn sig-btn--accent" onClick={handlePlayClick} disabled={isLoading || audio.isGenerating}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              {isLoading ? <path d="M12 4v16M12 4v16" /> : playing ? <path d="M6 4h4v16H6zM14 4h4v16h-4z" /> : <path d="M8 5v14l11-7z" />}
            </svg>
            {isLoading ? 'Loading...' : playing ? `Pause · ${totalTime ?? '--:--'}` : `Play today's episode · ${totalTime ?? '--:--'}`}
          </button>
          <button className="sig-btn sig-btn--archive" onClick={onSecondary}>
            <span>{secondaryLabel}</span>
            <ArrowIcon direction="right" size={18} className="sig-btn__arrow" />
          </button>
        </div>
      </div>

      <style>{`
        /* same as before — unchanged */
        .sig-hero { padding: 96px 0 120px; position: relative; }
        .sig-hero::before {
          content: ""; position: absolute;
          top: 10%; right: -10%; width: 520px; height: 520px;
          background: radial-gradient(circle, oklch(0.78 0.14 65 / 0.08), transparent 60%);
          pointer-events: none;
        }
        .sig-hero__pills { display: flex; gap: 10px; align-items: center; margin-bottom: 40px; flex-wrap: wrap; }
        .sig-hero__headline {
          font-family: var(--sans);
          font-size: clamp(48px, 7.4vw, 104px);
          line-height: 0.98; letter-spacing: -0.035em;
          font-weight: 500; margin: 0 0 36px;
          max-width: 1000px; text-wrap: balance;
        }
        .sig-hero__thesis {
          display: flex; gap: 14px; align-items: baseline;
          margin-bottom: 20px;
          font-family: var(--mono); font-size: 12px;
          color: var(--fg-faint);
        }
        .sig-hero__thesis-tag { color: var(--accent); }
        .sig-hero__sub {
          max-width: 620px;
          font-size: 17px; line-height: 1.55;
          color: var(--fg-dim);
          margin: 0 0 40px;
        }
        .sig-hero__ctas { display: flex; gap: 10px; flex-wrap: wrap; }

        @media (max-width: 900px) {
          .sig-hero { padding: 56px 0 72px; }
          .sig-hero__headline { font-size: clamp(40px, 10vw, 64px); }
        }
      `}</style>
    </section>
  );
}