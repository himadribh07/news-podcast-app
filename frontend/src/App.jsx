import React, { useEffect, useContext } from 'react';
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

function AppInner() {
  const {
    playing,
    totalTime,
    headline,
    description,
    setTotalTime,
    setHeadline,
    setDescription,
    setAudioSource,
    togglePlayPause,
  } = useContext(AudioContext);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        if (!res.ok) {
          console.error('Generate failed', await res.text());
          return;
        }
        const json = await res.json();
        console.log('API totalTime:', json.totalTime);

        setTotalTime(json.totalTime ?? '--:--');
        setHeadline(json.headline ?? '');
        setDescription(json.description ?? '');
        setAudioSource(`${API_BASE_URL}${json.audio_url}`);
      } catch (err) {
        console.error(err);
      }
    })();
  },[setAudioSource, setTotalTime, setHeadline, setDescription]);

  return (
    <div className="sig">
      <Nav onSubscribe={() => console.log('subscribe')} onListenNow={togglePlayPause} />
      <main>
        <Hero
          totalTime={totalTime}
          playing={playing}
          onPrimary={togglePlayPause}
          onSecondary={() => console.log('archive')}
        />
        <Ticker />
        <FeaturedEpisode
          title={headline}
          description={description}
          totalTime={totalTime}
          playing={playing}
          onPlay={togglePlayPause}
        />
        <EpisodeList onPlay={togglePlayPause} onViewAll={() => console.log('all')} />
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