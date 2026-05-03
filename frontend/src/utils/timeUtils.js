/**
 * Format seconds to MM:SS display format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time as MM:SS
 */
export const formatTimeDisplay = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get formatted date string with ordinal suffix
 * @returns {string} Date in format like '3rd_May' or '21st_June'
 */
export const getFormattedDate = () => {
  const now = new Date();
  const day = now.getDate();
  const month = now.toLocaleString('en-US', { month: 'long' });
  
  const suffix = {1: 'st', 2: 'nd', 3: 'rd'}.hasOwnProperty(day % 10) && ![11, 12, 13].includes(day % 100) 
    ? {1: 'st', 2: 'nd', 3: 'rd'}[day % 10] 
    : 'th';
  
  return `${day}${suffix}_${month}`;
};

export const transcriptFormattedDate = () => {
  const now = new Date();
  const day = now.getDate();
  const month = now.toLocaleString('en-US', { month: 'long' });
  
  const suffix = {1: 'st', 2: 'nd', 3: 'rd'}.hasOwnProperty(day % 10) && ![11, 12, 13].includes(day % 100) 
    ? {1: 'st', 2: 'nd', 3: 'rd'}[day % 10] 
    : 'th';
  
  return `${day}${suffix} ${month}`;
};

/**
 * Calculate progress ratio from current time and duration
 * @param {number} currentTime - Current playback time in seconds
 * @param {number} duration - Total duration in seconds
 * @returns {number} Progress ratio (0..1)
 */
export const calculateProgress = (currentTime, duration) => {
  if (!duration) return 0;
  return currentTime / duration;
};

/**
 * Convert MM:SS format to "X MIN" display format
 * @param {string} timeString - Time in MM:SS format (e.g., "18:04")
 * @returns {string} Duration in X MIN format (e.g., "18 MIN")
 */
export const convertToMinFormat = (timeString) => {
  if (!timeString || timeString === '--:--') return '--:--';
  
  // Handle if it's already in MIN format
  if (typeof timeString === 'string' && timeString.includes('MIN')) {
    return timeString;
  }
  
  const parts = timeString.split(':');
  if (parts.length < 2) return '--:--';
  
  const minutes = parseInt(parts[0], 10);
  if (isNaN(minutes)) {
    console.warn('Invalid minutes in timeString:', timeString);
    return '--:--';
  }
  
  return `${minutes} MIN`;
};

/**
 * Calculate episode number based on total episodes produced
 * Fetches from backend API which counts existing episode files
 * @returns {Promise<number>} Episode number (total episodes produced)
 */
export const getEpisodeNumber = async () => {
  try {
    const res = await fetch('http://localhost:8000/episode-count');
    if (!res.ok) throw new Error('Failed to fetch episode count');
    const data = await res.json();
    return data.totalEpisodes || 1;
  } catch (err) {
    console.warn('Could not fetch episode count, defaulting to 1:', err);
    return 1;
  }
};

/**
 * Get episode eyebrow text with dynamic episode number
 * @returns {Promise<string>} Eyebrow text like "◇ Featured · Episode 5"
 */
export const getEpisodeEyebrow = async () => {
  const episodeNum = await getEpisodeNumber();
  return `◇ Featured · Episode ${episodeNum}`;
};
