import React, { createContext, useRef, useState, useCallback, useEffect } from 'react';

export const AudioContext = createContext(null);

export function AudioProvider({ children }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [totalTime, setTotalTime] = useState('--:--');

  // Initialize audio element with all event listeners
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();

      // Add event listeners
      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(audioRef.current.currentTime);
      });

      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current.duration);
      });

      audioRef.current.addEventListener('ended', () => {
        setPlaying(false);
      });
    }
  }, []);

  const setAudioSource = useCallback((url) => {
    if (audioRef.current) {
      audioRef.current.src = url;
    }
  }, []);

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
      setPlaying(true);
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
      } else {
        audioRef.current.play();
        setPlaying(true);
      }
    }
  }, [playing]);

  return (
    <AudioContext.Provider
      value={{
        audioRef,
        playing,
        setPlaying,
        currentTime,
        setCurrentTime,
        duration,
        setDuration,
        totalTime,
        setTotalTime,
        setAudioSource,
        play,
        pause,
        togglePlayPause,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}
