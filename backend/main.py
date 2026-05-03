import os
import re
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
# Only import the modern google-genai SDK
from google import genai
from google.genai import types
from dotenv import load_dotenv
from gtts import gTTS
from pydub.utils import mediainfo
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional
from mutagen.mp3 import MP3

load_dotenv()

# .strip() prevents trailing spaces or newlines in the .env from breaking the key
API_KEY = os.getenv("API_KEY", "").strip() 
if not API_KEY:
    raise RuntimeError("API_KEY not set in environment")

# Initialize the modern client
client = genai.Client(api_key=API_KEY)

app = FastAPI(title="News Podcast API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "https://news-podcast-app.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(OUTPUT_DIR, exist_ok=True)
TRANSCRIPTS_DIR = os.path.join(os.path.dirname(__file__), "transcripts")
os.makedirs(TRANSCRIPTS_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=OUTPUT_DIR), name="static")


ALL_GENRES = [
    "Front Page / Breaking News",
    "International News",
    "Politics",
    "Finance",
    "Sports",
    "Entertainment",
    "Technology",
    "Health",
]

GENRE_BLOCKS = {
    "Front Page / Breaking News": """
    ## Front Page / Breaking News (India-focused)
    - Include the most important national or global breaking stories from the last 24 hours
    - Government decisions, emergencies, major incidents
    """,
    "International News": """
    ## International News
    - Major global events, geopolitics, conflicts, diplomacy
    - Focus on stories with India relevance when possible
    """,
    "Politics": """
    ## Politics
    - Indian politics only
    - Government decisions, elections, policy changes, parliament updates
    """,
    "Finance": """
    ## Finance
    - Indian markets, RBI updates, inflation, startups, major corporate news
    """,
    "Sports": """
    ## Sports
    - Cricket (India priority)
    - Football (major leagues only)
    - Any major international sports events
    """,
    "Entertainment": """
    ## Entertainment
    - Bollywood first
    - Major Hollywood or global entertainment news
    """,
    "Technology": """
    ## Technology
    - Indian tech startups and companies
    - Major tech announcements, AI, cyber security
    - Innovation and digital transformation
    """,
    "Health": """
    ## Health
    - Health policy updates, disease prevention
    - Medical breakthroughs and research
    - Public health alerts and wellness news
    """,
}


class GenerateRequest(BaseModel):
    genres: Optional[List[str]] = None
    states: Optional[List[str]] = None


def clean_text_for_output(text: str) -> str:
    """Strip Markdown for TTS."""
    text = re.sub(r"^#+\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"\*(.*?)\*", r"\1", text)
    text = re.sub(r"\*", "", text)
    text = re.sub(r"^\s*[-•]\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"[#@&`]", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()



def get_audio_duration(audio_path: str) -> str:
    try:
        audio = MP3(audio_path)
        duration_seconds = audio.info.length
        if duration_seconds == 0:
            return "--:--"
        minutes = int(duration_seconds // 60)
        seconds = int(duration_seconds % 60)
        return f"{minutes:02d}:{seconds:02d}"
    except Exception as e:
        print(f"Failed to get audio duration: {e}")
        return "--:--"


def get_date_formatted() -> str:
    """Return date in format like '3rd_May' or '21st_June'."""
    now = datetime.now()
    day = now.day
    month = now.strftime("%B")
    
    # Add suffix to day (st, nd, rd, th)
    if 10 <= day % 100 <= 20:
        suffix = "th"
    else:
        suffix = {1: "st", 2: "nd", 3: "rd"}.get(day % 10, "th")
    
    return f"{day}{suffix}_{month}"


def check_existing_audio():
    """Check if audio for today already exists."""
    date_str = get_date_formatted()
    audio_file = f"{date_str}_audio.mp3"
    transcript_file = f"{date_str}_file.json"
    audio_path = os.path.join(OUTPUT_DIR, audio_file)
    transcript_path = os.path.join(TRANSCRIPTS_DIR, transcript_file)
    
    if os.path.exists(audio_path) and os.path.exists(transcript_path):
        with open(transcript_path, 'r') as f:
            transcript_data = json.load(f)
        return {
            "audio_url": f"/static/{audio_file}",
            "transcript_url": f"/transcript/{date_str}",
            "date": transcript_data.get("date"),
            "genres": transcript_data.get("genres"),
            "states": transcript_data.get("states"),
            "script": transcript_data.get("script"),
            "totalTime": transcript_data.get("totalTime"),
            "cached": True,
        }
    return None


def build_prompt(genres: List[str], states: List[str]) -> str:
    genre_instructions = "".join(GENRE_BLOCKS[g] for g in genres if g in GENRE_BLOCKS)

    if "All States" in states or not states:
        state_info = "Include news from across all Indian states and union territories."
    else:
        state_info = f"PRIORITY: Focus on these states: {', '.join(states)}."

    return f"""
    You are a professional news editor.

    Give me factual, concise news items from the last 24 hours only.

    Formatting rules (STRICT):
    - Use bullet points only
    - Each bullet must be: **Headline** — one-line factual detail
    - One-line detail must explain what happened or why it matters
    - Max 20-25 words per detail
    - No opinions, no speculation, no repetition
    - Clean, neutral tone suitable for audio narration

    {genre_instructions}
    {state_info}
    """


@app.post("/generate")
async def generate_episode(req: GenerateRequest):
    """Generate news audio. Returns audio_url under /static."""
    # Check if audio for today already exists
    existing = check_existing_audio()
    if existing:
        return JSONResponse(existing)
    
    if not req.genres or "ALL" in req.genres:
        selected_genres = ALL_GENRES
    else:
        selected_genres = [g for g in req.genres if g in ALL_GENRES]
        if not selected_genres:
            selected_genres = ALL_GENRES

    selected_states = req.states or ["All States"]
    prompt = build_prompt(selected_genres, selected_states)

    try:
        # Correctly calling the model using the modern SDK
        resp = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[{"google_search": {}}] # Correct syntax for search retrieval
            )
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model request failed: {e}")

    raw_news_text = (resp.text or "").strip()
    if not raw_news_text:
        raise HTTPException(status_code=500, detail="Empty response from model")

    clean_news_text = clean_text_for_output(raw_news_text)

    # Use date-based filename
    date_str = get_date_formatted()
    audio_filename = f"{date_str}_audio.mp3"
    transcript_filename = f"{date_str}_file.json"
    audio_path = os.path.join(OUTPUT_DIR, audio_filename)
    transcript_path = os.path.join(TRANSCRIPTS_DIR, transcript_filename)

    try:
        tts = gTTS(clean_news_text, lang="en", tld="co.in")
        tts.save(audio_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS failed: {e}")

    # Get audio duration
    total_time = get_audio_duration(audio_path)

    # Save transcript as JSON
    transcript_data = {
        "date": datetime.utcnow().isoformat(),
        "genres": selected_genres,
        "states": selected_states,
        "script": clean_news_text,
        "totalTime": total_time,
    }
    try:
        with open(transcript_path, 'w') as f:
            json.dump(transcript_data, f, indent=2)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save transcript: {e}")

    return JSONResponse({
        "audio_url": f"/static/{audio_filename}",
        "transcript_url": f"/transcript/{date_str}",
        "date": transcript_data["date"],
        "genres": selected_genres,
        "states": selected_states,
        "script": clean_news_text,
        "totalTime": total_time,
        "cached": False,
    })


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/episode-count")
async def get_episode_count():
    """Get total number of episodes produced by counting transcript files."""
    try:
        if not os.path.exists(TRANSCRIPTS_DIR):
            return {"totalEpisodes": 0}
        
        # Count all transcript files (format: "3rd_May_file.json")
        transcript_files = [f for f in os.listdir(TRANSCRIPTS_DIR) if f.endswith("_file.json")]
        total_episodes = len(transcript_files)
        
        return {"totalEpisodes": total_episodes}
    except Exception as e:
        print(f"Error counting episodes: {e}")
        return {"totalEpisodes": 1}  # Default to 1 if error


@app.get("/transcript/{date_str}")
async def get_transcript(date_str: str):
    """Get transcript by date string (e.g., '3rd_May')."""
    transcript_filename = f"{date_str}_file.json"
    transcript_path = os.path.join(TRANSCRIPTS_DIR, transcript_filename)
    
    if not os.path.exists(transcript_path):
        raise HTTPException(status_code=404, detail=f"Transcript not found for {date_str}")
    
    try:
        with open(transcript_path, 'r') as f:
            transcript_data = json.load(f)
        return transcript_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read transcript: {e}")


@app.get("/audio/{filename}")
async def get_audio(filename: str):
    path = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(path, media_type="audio/mpeg")