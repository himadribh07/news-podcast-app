# Signal - Daily News Podcast App

A modern web application that generates, stores, and streams daily news podcast episodes. Features AI-powered content generation, audio synthesis, and a beautiful responsive interface.

## 🎯 Overview

Signal is a daily briefing platform that:
- **Generates** news content automatically using Google's Gemini 2.5 API
- **Synthesizes** MP3 audio using Google Text-to-Speech (gTTS)
- **Stores** episodes in Cloudflare R2 (S3-compatible object storage)
- **Serves** episodes with a beautiful React + Vite frontend
- **Archives** episodes for 14 days with automatic cleanup
- **Auto-cleans** old episodes: keeps only the last 14 days, deletes older ones automatically when new episodes are added

**Features:**
- ✨ Daily auto-generated episode with 3-part content (headline, description, script)
- 🎙️ Independent audio playback for today's episode and past episodes
- 📑 Transcript viewing with modal display
- 🎯 7-day ticker showing recent headlines
- 📱 Responsive design (mobile-first)
- 🌙 Dark theme with accent colors
- ⚡ Zero-concurrency race condition prevention
- 🔄 14-day archive with automatic cleanup
- 🗑️ **Automatic deletion of episodes older than 14 days**

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI + uvicorn
- **API**: Google Gemini 2.5-flash for content generation
- **TTS**: gTTS (Google Text-to-Speech) for audio
- **Storage**: Cloudflare R2 with boto3 client
- **Utilities**: Mutagen (MP3 metadata), CORS middleware

### Frontend
- **Framework**: React 18+ with Vite
- **State Management**: Context API
- **Styling**: CSS-in-JS (inline styles)
- **UI**: Responsive grid layouts, SVG icons
- **Date Formatting**: Custom ordinal suffix formatting

### Deployment
- **Backend**: Render.com (Node.js/Python runtime)
- **Frontend**: Render.com (static site)
- **Storage**: Cloudflare R2 buckets
- **Domain**: Custom domain with Cloudflare

## 📁 Project Structure

```
news-podcast-app/
├── backend/
│   ├── main.py                 # FastAPI server
│   ├── requirements.txt         # Python dependencies
│   └── static/                  # Static files (if any)
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main app component with routing
│   │   ├── App.css             # Global styles
│   │   ├── main.jsx            # React entry point
│   │   ├── index.css           # CSS variables and base styles
│   │   ├── components/
│   │   │   ├── Hero.jsx                    # Featured episode section
│   │   │   ├── FeaturedEpisode.jsx         # Today's episode with waveform
│   │   │   ├── EpisodeList.jsx             # Recent past episodes (7 days)
│   │   │   ├── Archive.jsx                 # 14-day episode archive
│   │   │   ├── Ticker.jsx                  # Auto-scrolling headline marquee
│   │   │   ├── Nav.jsx                     # Sticky navigation
│   │   │   ├── BrandMark.jsx               # Logo component
│   │   │   ├── Subscribe.jsx               # Subscribe CTA
│   │   │   ├── Footer.jsx                  # Footer section
│   │   │   └── ArrowIcon.jsx               # Reusable arrow icon
│   │   ├── context/
│   │   │   └── AudioContext.jsx            # Global audio state (today's episode only)
│   │   └── utils/
│   │       ├── apiConfig.js                # API URL configuration
│   │       ├── formatDate.js               # Date formatting utilities
│   │       └── highlightWords.js           # Random word highlighting
│   │
│   ├── package.json            # Node dependencies
│   ├── vite.config.js          # Vite build config
│   ├── eslint.config.js        # ESLint rules
│   └── index.html              # HTML entry point
│
└── README.md                    # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ (for frontend)
- Python 3.8+ (for backend)
- Cloudflare R2 account with bucket
- Google Gemini API key

### Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Create `.env` file (or set environment variables):**
   ```bash
   API_KEY=your_gemini_api_key
   R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
   R2_ACCESS_KEY=your_r2_access_key
   R2_SECRET_KEY=your_r2_secret_key
   R2_BUCKET=your_bucket_name
   R2_PUBLIC_URL=https://your_public_r2_url.com
   ```

3. **Run development server:**
   ```bash
   uvicorn main:app --reload
   ```
   Server runs on `http://localhost:8000`

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Update API URL in `src/utils/apiConfig.js`:**
   ```javascript
   const PRODUCTION_API = 'https://your-api.onrender.com';
   const LOCAL_API = 'http://localhost:8000';
   const API_BASE_URL = LOCAL_API; // Development
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```
   Frontend runs on `http://localhost:5173`

## 📡 API Endpoints

### `POST /generate`
Generate today's episode.
- **Request**: `{}`
- **Response**:
  ```json
  {
    "audio_url": "/episodes/6th_May.mp3",
    "headline": "Markets brace for Fed...",
    "description": "Summary text...",
    "totalTime": "18:04"
  }
  ```

### `GET /episodes?limit=999`
List all episodes (cached and paginated).
- **Response**:
  ```json
  {
    "episodes": [
      {
        "num": 412,
        "date_str": "6th_May",
        "headline": "...",
        "description": "...",
        "audio_url": "https://...",
        "totalTime": "18:04",
        "created_at": "2026-05-06T..."
      }
    ]
  }
  ```

### `GET /transcript/{date_str}`
Fetch transcript for a specific episode.
- **Response**:
  ```json
  {
    "headline": "...",
    "description": "...",
    "script": "Full transcript text..."
  }
  ```

## 🎨 Key Components

### Hero.jsx
- Featured section with today's episode
- Play button triggers `/generate` if needed
- Displays pills: "Today's Briefing · Live", date, duration
- Navigation buttons: Play, Browse Archive

### FeaturedEpisode.jsx
- Large play button (88x88px) with loading spinner
- Waveform visualization (80 bars, deterministic animation)
- Transcript button and modal
- Independent from EpisodeList playback (uses shared context but doesn't affect others)

### EpisodeList.jsx
- Recent past episodes (excludes today)
- Grid layout: episode number | title+description | date | duration | transcript | play
- Local audio element (independent from today's episode)
- Episode number formatting: `001`, `002`, etc.

### Archive.jsx
- 14-day episode filtering
- Same layout as EpisodeList
- Back button to return home
- Filtered by `isWithinLast14Days()` helper

### Ticker.jsx
- Auto-scrolling marquee of last 7 days
- Headlines truncated at first comma
- Format: `EP 001 · Headline text`

### AudioContext.jsx
- Global state for **today's episode only**
- Manages: audioRef, playing status, currentTime, duration, headline, description
- Race condition prevention: `isGenerating` flag + `runGenerate()` wrapper
- Past episodes use local `useRef()` elements in EpisodeList/Archive

## 🔄 Audio Architecture

**Separate audio streams prevent interference:**

1. **Today's Episode (Shared)**
   - Stored in `AudioContext` via `audio.audioRef`
   - Used by: Hero (play button), FeaturedEpisode (waveform/display)
   - Single audio element shared across components

2. **Past Episodes (Local)**
   - Each component creates own `useRef(null)` for audio element
   - Used by: EpisodeList, Archive
   - No shared state—fully independent playback
   - Pauses when today's episode starts (via `useEffect` watching `audio.playing`)

**Result**: 
- Playing a past episode doesn't affect FeaturedEpisode's waveform or state
- FeaturedEpisode plays smoothly regardless of past episode selection
- Clear separation of concerns

## �️ Automatic Cleanup (14-Day Retention)

Episodes are automatically retained for exactly 14 days. Older episodes are deleted automatically when a new episode is generated.

**How it works:**
1. When `/generate` endpoint is called, a new episode is created and uploaded to R2
2. After successful upload, `cleanup_old_episodes()` is triggered
3. The function scans all transcript files in R2
4. Episodes with `created_at` date older than 14 days are identified
5. Both the **audio file** (`{date}_audio.mp3`) and **transcript** (`{date}_file.json`) are deleted
6. Cleanup logs are printed to backend console for monitoring

**Example cleanup log:**
```
[CLEANUP] Starting cleanup of episodes older than 14 days...
[CLEANUP] Found 20 objects in transcripts/
[CLEANUP] Keeping episode: 6th_May (created: 2026-05-06)
[CLEANUP] Keeping episode: 5th_May (created: 2026-05-05)
[CLEANUP] Deleting old episode: 22nd_April (created: 2026-04-22)
[CLEANUP] ✓ Deleted transcript: 22nd_April_file.json
[CLEANUP] ✓ Deleted audio: 22nd_April_audio.mp3
[CLEANUP] Cleanup complete. Deleted 1 old episode(s).
```

**Benefits:**
- 💰 Reduces R2 storage costs (only stores 2 weeks of content)
- 🧹 No manual cleanup required
- ⚡ Automatic during peak generation time (after /generate succeeds)
- 📊 Consistent 14-day window always maintained

**Technical Details:**
- Uses `parse_date_str()` to extract and parse date from filename
- Compares episode date against `datetime.now() - timedelta(days=14)`
- Deletes both transcript JSON and audio MP3 simultaneously
- Errors during cleanup are logged but don't fail the `/generate` request

## 📊 Storage Optimization

**Universal numbering system:**
- Based on `created_at` ISO timestamp (oldest → newest)
- All episodes numbered 1 to N sequentially
- Numbers preserved across views and filters

**Display behavior:**
- EpisodeList: Shows latest first (sorted descending by date)
- Archive: Shows latest first (sorted descending by date)
- Numbers remain consistent: `001`, `002`, etc.

## 🌍 Deployment

### Deploy to Render.com

1. **Backend Deployment:**
   - Connect GitHub repo to Render
   - Create new Web Service
   - Runtime: Python 3.11
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Environment variables: Set R2 credentials, Gemini API key

2. **Frontend Deployment:**
   - Create new Static Site
   - Build command: `npm install && npm run build`
   - Publish directory: `frontend/dist`

3. **Update API URL:**
   - Change `apiConfig.js` to production API:
     ```javascript
     const API_BASE_URL = 'https://your-api.onrender.com';
     ```

### R2 Storage Setup

1. Create bucket in Cloudflare R2
2. Set public URL for serving audio/transcripts
3. Configure CORS if needed
4. Store credentials as environment variables

## 🎯 Features Explained

### Race Condition Prevention
The `runGenerate()` wrapper in AudioContext prevents multiple `/generate` calls:
```javascript
await audio.runGenerate(async () => {
  // Only executes if isGenerating is false
  // Sets isGenerating = true during execution
  // Prevents rapid clicks from queuing requests
});
```

### Date Formatting
Ordinal suffix formatting for "Nth_Month" format:
- `6th_May`, `21st_June`, `3rd_July`
- Used in filenames, URLs, and display

### Responsive Design
- Desktop: Full grid with all columns visible
- Mobile: Reduced column count, hidden date/duration
- Breakpoint: 900px

### Word Highlighting
Random words in headlines/descriptions highlighted with CSS class:
- Filters out stopwords (the, and, is, etc.)
- Only highlights 4+ character words
- Used in: Hero headline, descriptions, transcripts

## 📝 Development Notes

### Backend Helper Functions

**Cleanup Functions:**
- `parse_date_str(date_str)` — Converts date strings like "6th_May" to datetime objects
- `cleanup_old_episodes()` — Scans R2 and deletes episodes older than 14 days

**Example usage in code:**
```python
# Called automatically after uploading new episode
cleanup_old_episodes()

# Parse a date string to check age
episode_date = parse_date_str("6th_May")
if episode_date < datetime.now() - timedelta(days=14):
    # Delete old episode
```

### Common Tasks

**Generate a new episode manually:**
```bash
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Test transcript retrieval:**
```bash
curl http://localhost:8000/transcript/6th_May
```

**Check episode list:**
```bash
curl http://localhost:8000/episodes?limit=10
```

### Debugging

1. **Check backend logs** (Render):
   - Open Web Service → Logs tab
   - Filter by error level if needed

2. **Check R2 uploads**:
   - Log into Cloudflare R2
   - Verify `episodes/` and `transcripts/` folders contain files

3. **Network tab** (Browser DevTools):
   - Verify `/generate` returns correct audio URL
   - Check `/episodes` returns proper episode list
   - Confirm transcript files exist in R2

### Performance Optimization

- **Caching**: `/generate` checks R2 for today's file before API call
- **Pagination**: `/episodes` supports `?limit=` parameter
- **Memoization**: Hero headline highlights memoized to prevent re-renders
- **Audio lazy-loading**: Episodes only load audio when played

## 🔐 Security Considerations

- Store API keys in environment variables (never in code)
- CORS configured for allowed origins
- R2 bucket policies should restrict public access to safe assets
- No sensitive data in frontend code

## 📄 License

MIT License - feel free to use and modify

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch
3. Make changes
4. Submit pull request

## 📞 Support

For issues or questions:
- Check the troubleshooting section above
- Review backend logs on Render
- Verify R2 credentials and bucket access
- Ensure environment variables are set correctly
