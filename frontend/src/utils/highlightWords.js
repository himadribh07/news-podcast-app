import React from 'react';

const DEFAULT_STOPWORDS = new Set([
  'the','and','for','with','that','this','from','have','has','are','was','were','been','will','would','could','should','a','an','in','on','at','to','of','by','is','it','as','be','not','or','but','if','they','their','them','its','we','our','you','your'
]);

export function highlightRandomWords(rawText, {count = 3, stopwords = DEFAULT_STOPWORDS, className = 'sig-it'} = {}) {
  if (!rawText || typeof rawText !== 'string') return rawText;

  // Split into tokens while preserving whitespace/punctuation
  const tokens = rawText.split(/(\s+|[^\w\u00C0-\u017F]+)/g).filter(Boolean);

  // Collect candidate token indices for highlighting
  const candidates = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    // only words (letters/numbers/apostrophes) count
    if (!/^[\p{L}\p{N}'`-]+$/u.test(t)) continue;
    const lower = t.toLowerCase();
    if (stopwords.has(lower)) continue;
    if (lower.length < 4) continue; // skip very short words
    candidates.push(i);
  }

  // Pick up to `count` random unique indices
  const chosen = new Set();
  const max = Math.min(count, candidates.length);
  while (chosen.size < max) {
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    chosen.add(pick);
  }

  // Build React node array
  const out = tokens.map((tok, idx) => {
    if (chosen.has(idx)) {
      return React.createElement('span', { key: idx, className }, tok);
    }
    return tok;
  });

  return out;
}
