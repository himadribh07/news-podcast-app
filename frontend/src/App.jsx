import React from 'react';
import './App.css';

import Nav              from './components/Nav';
import Hero             from './components/Hero';
import Ticker           from './components/Ticker';
import FeaturedEpisode  from './components/FeaturedEpisode';
import EpisodeList      from './components/EpisodeList';
import TopicsGrid       from './components/TopicsGrid';
import Hosts            from './components/Hosts';
import Subscribe        from './components/Subscribe';
import Footer           from './components/Footer';

/**
 * Demo composition — drop these components anywhere in your app.
 * The whole tree must live inside an element with className="sig"
 * so the design tokens (--bg, --fg, --accent, etc.) apply.
 */
export default function App() {
  const handlePlay = (ep) => {
    console.log('play', ep);
    // Fetch generated audio from backend and play it
    (async () => {
      try {
        const res = await fetch('http://localhost:8000/generate', { method: 'POST' });
        if (!res.ok) {
          console.error('Generate request failed', await res.text());
          return;
        }
        const json = await res.json();
        const audioRes = await fetch(`http://localhost:8000${json.audio_url}`);
        if (!audioRes.ok) {
          console.error('Failed to fetch audio', await audioRes.text());
          return;
        }
        const blob = await audioRes.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        await audio.play();
      } catch (err) {
        console.error(err);
      }
    })();
  };

  return (
    <div className="sig">
      <Nav
        onSubscribe={() => console.log('subscribe')}
        onListenNow={handlePlay}
      />
      <main>
        <Hero onPrimary={handlePlay} onSecondary={() => console.log('archive')} />
        <Ticker />
        <FeaturedEpisode onPlay={handlePlay} />
        <EpisodeList onPlay={handlePlay} onViewAll={() => console.log('all')} />
        {/* <TopicsGrid onSelect={(t) => console.log('topic', t)} /> */}
        <Hosts />
        <Subscribe onSelect={(p) => console.log('platform', p)} />
      </main>
      <Footer />
    </div>
  );
}
