import React, { useEffect, useContext, useState } from 'react';
import { AudioProvider, AudioContext } from './context/AudioContext';
import API_BASE_URL from './utils/apiConfig';
import './App.css';

import Nav              from './components/Nav';
import Hero             from './components/Hero';
import Ticker           from './components/Ticker';
import FeaturedEpisode  from './components/FeaturedEpisode';
import EpisodeList      from './components/EpisodeList';
import Subscribe        from './components/Subscribe';
import Footer           from './components/Footer';
import Archive          from './components/Archive';

function AppInner() {
  const {
    playing, totalTime, headline, description,
    setTotalTime, setHeadline, setDescription, setAudioSource, togglePlayPause,
  } = useContext(AudioContext);

  const [view, setView] = useState('home'); // 'home' | 'archive'

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        if (!res.ok) return;
        const json = await res.json();

        setTotalTime(json.totalTime ?? '--:--');
        setHeadline(json.headline ?? '');
        setDescription(json.description ?? '');
        const audioUrl = json.audio_url.startsWith('http')
          ? json.audio_url
          : `${API_BASE_URL}${json.audio_url}`;
        setAudioSource(audioUrl);
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
        <Subscribe onSelect={(p) => console.log('platform', p)} />
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