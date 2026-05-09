import React, { useEffect, useContext, useState, useRef } from 'react';
import { AudioProvider, AudioContext } from './context/AudioContext';
import API_BASE_URL from './utils/apiConfig';
import { getFormattedDate } from './utils/timeUtils';
import './App.css';

import Nav              from './components/Nav';
import Hero             from './components/Hero';
import Ticker           from './components/Ticker';
import FeaturedEpisode  from './components/FeaturedEpisode';
import EpisodeList      from './components/EpisodeList';
import Subscribe        from './components/Subscribe';
import Footer           from './components/Footer';
import Archive          from './components/Archive';
import About            from './components/About';

function AppInner() {
  const {
    playing, totalTime, headline, description,
    setTotalTime, setHeadline, setDescription, setAudioSource, togglePlayPause,
  } = useContext(AudioContext);

  const [view, setView] = useState('home'); // 'home' | 'archive'
  const hasInitialized = useRef(false);

  // Sync view with URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'home'; // Remove '#' prefix
      if (hash === 'archive' || hash === 'home') {
        setView(hash);
      }
    };

    // Set initial view from URL
    handleHashChange();

    // Listen for hash changes (back/forward button, manual URL edit)
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update URL when view changes
  useEffect(() => {
    window.location.hash = view;
  }, [view]);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    (async () => {
      try {
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
        const attemptGenerate = async (attempt = 1) => {
          const res = await fetch(`${API_BASE_URL}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: getFormattedDate() }),
          });
          if (res.ok) return await res.json();
          let body = null;
          try { body = await res.json(); } catch (e) { body = null; }
          console.warn('Initial generate failed', res.status, body || await res.text().catch(() => ''));
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
            // Don't alert on initial preload; just bail quietly
            return null;
          }
          return null;
        };

        const json = await attemptGenerate();
        if (!json) return;

        setTotalTime(json.totalTime ?? '--:--');
        setHeadline(json.headline ?? '');
        setDescription(json.description ?? '');

        const audioUrl = json.audio_url.startsWith('http')
          ? json.audio_url
          : `${API_BASE_URL}${json.audio_url}`;

        setAudioSource(audioUrl);

        // Auto-play once src loaded
        audioRef.current.addEventListener('canplay', () => {
          audioRef.current.play().catch(err => {
            console.warn('Autoplay blocked by browser:', err);
          });
        }, { once: true });
      } catch (err) {
        console.error(err);
      }
    })();
  }, [setAudioSource, setTotalTime, setHeadline, setDescription]);

  // Archive view
  if (view === 'archive') {
    return (
      <div className="sig">
        <Nav
          onSubscribe={() => console.log('subscribe')}
          onListenNow={() => setView('home')}
          onArchive={() => setView('archive')}
          onEpisodes={() => setView('home')}
          onDailyBriefing={() => {
            setView('home');
            setTimeout(() => {
              const el = document.getElementById('featured-episode');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
          onHome={() => setView('home')}
        />
        <Archive onClose={() => setView('home')} />
        <Footer />
      </div>
    );
  }

  // Home view
  return (
    <div className="sig">
      <Nav
        onSubscribe={() => console.log('subscribe')}
        onListenNow={togglePlayPause}
        onArchive={() => setView('archive')}
        onEpisodes={() => setView('home')}
        onDailyBriefing={() => {
          setTimeout(() => {
            const el = document.getElementById('featured-episode');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 50);
        }}
        onHome={() => setView('home')}
      />
      <main>
        <Hero
          totalTime={totalTime}
          playing={playing}
          onPrimary={togglePlayPause}
          onSecondary={() => setView('archive')}
        />
        <Ticker />
        <FeaturedEpisode
          title={headline}
          description={description}
          totalTime={totalTime}
          playing={playing}
          onPlay={togglePlayPause}
        />
        <EpisodeList onViewAll={() => setView('archive')} />
        <About />
        {/* <Subscribe onSelect={(p) => console.log('platform', p)} /> */}
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AudioProvider>
      <AppInner />
    </AudioProvider>
  );
}