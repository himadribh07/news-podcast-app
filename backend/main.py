import os
import re
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from google import genai
from google.genai import types
from dotenv import load_dotenv
from gtts import gTTS
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional
from mutagen.mp3 import MP3

load_dotenv()

API_KEY = os.getenv("API_KEY", "").strip()
if not API_KEY:
    raise RuntimeError("API_KEY not set in environment")

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
            "headline": transcript_data.get("headline"),
            "description": transcript_data.get("description"),
            "script": transcript_data.get("script"),
            "totalTime": transcript_data.get("totalTime"),
            "cached": True,
        }
    return None


def clean_inline(text: str) -> str:
    """Strip markdown + section labels from headline/description blocks."""
    text = re.sub(
        r"^(SECTION\s*\d+\s*[—-]?\s*)?(HEADLINE|DESCRIPTION|SCRIPT)\s*[:.]?\s*",
        "",
        text,
        flags=re.IGNORECASE,
    )
    text = re.sub(r"^\d+\.\s*", "", text)
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"\*(.*?)\*", r"\1", text)
    text = re.sub(r"^#+\s*", "", text, flags=re.MULTILINE)
    return text.strip()


def parse_episode_response(raw_text: str) -> dict:
    """Parse Gemini 3-section response separated by '---'."""
    headline = "Today's News"
    description = "Essential news briefing"
    script = raw_text.strip()

    parts = [p.strip() for p in raw_text.split("---") if p.strip()]

    if len(parts) >= 3:
        headline = clean_inline(parts[0])
        description = clean_inline(parts[1])
        script = parts[2] if len(parts) == 3 else "\n\n".join(parts[2:])
        # strip SCRIPT header from script section
        script = re.sub(r"^#+\s*SCRIPT\s*", "", script, flags=re.IGNORECASE).strip()
        script = re.sub(r"^\d+\.\s*", "", script).strip()

    return {"headline": headline, "description": description, "script": script}


def build_prompt(genres: List[str], states: List[str]) -> str:
    genre_instructions = "".join(GENRE_BLOCKS[g] for g in genres if g in GENRE_BLOCKS)

    if "All States" in states or not states:
        state_info = "Include news from across all Indian states and union territories."
    else:
        state_info = f"PRIORITY: Focus on these states: {', '.join(states)}."

    return f"""
You are a professional news editor writing today's daily briefing.

OUTPUT FORMAT — STRICT:
You MUST output exactly 3 sections separated by "---" on its own line.
Do NOT include section labels like "HEADLINE:" or "1." — just the content.
Do NOT use markdown bold/italic in headline or description.

SECTION 1 — HEADLINE
A single sentence summarizing today's biggest stories.
MUST be 15-22 words.
MUST be a complete, grammatical sentence ending with a period.
Editorial tone. Specific. Not generic.
Example: "Markets brace for the Reserve Bank's rate decision while a major AI bill clears committee and census numbers reshape three districts."

---

SECTION 2 — DESCRIPTION
A 3-4 line paragraph describing what today's episode covers.
MUST be 50-80 words total.
Mention 2-3 specific stories from the script below.
Do NOT mention any host name. Do NOT use first person.
Example: "Today's briefing opens with the latest from the Reserve Bank, then turns to the unfolding policy debate in Parliament. We cover three corporate moves shaping Indian markets, the cricket result that mattered, and a tech announcement with global reach. Eight stories. Plain language. Under twenty minutes."

---

SECTION 3 — SCRIPT
The full news bullets organized by category.

Per-bullet format:
- Each bullet starts with a bold headline
- Followed by an em-dash and explanatory lines beneath it
- Format: **Headline** — explanation

Length rules per category:
- Sports, Technology, Entertainment: headline + 1-2 lines (max 25 words explanation)
- All other categories (Front Page, International, Politics, Finance, Health): headline + 2-3 lines (40-60 words explanation)

General rules (STRICT):
- Bullet points only
- No opinions, no speculation, no repetition
- Clean, neutral tone for audio narration
- Last 24 hours only
- Group bullets under their category heading (e.g. "## Politics")

Example bullets:

Politics (longer — 2-3 lines):
**Parliament passes data protection bill** — The Lok Sabha cleared the Digital Personal Data Protection Bill late Tuesday after a six-hour debate. The bill imposes fines up to ₹250 crore for breaches and creates a new regulatory body. Opposition members walked out before the final vote, citing inadequate safeguards.

Sports (shorter — 1-2 lines):
**India beat Australia by 7 wickets in T20 opener** — Chasing 168, Suryakumar Yadav's unbeaten 75 sealed the win in 17.2 overs at Mumbai's Wankhede Stadium.

Technology (shorter — 1-2 lines):
**Reliance launches AI assistant for JioMart** — The retail platform rolled out a Hindi-language shopping bot powered by an in-house LLM, available across 500 cities from today.

{genre_instructions}
{state_info}
"""


@app.post("/generate")
async def generate_episode(req: GenerateRequest):
    """Generate news audio. Returns audio_url under /static."""
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
        resp = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[{"google_search": {}}]
            )
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model request failed: {e}")

    raw_news_text = (resp.text or "").strip()
    if not raw_news_text:
        raise HTTPException(status_code=500, detail="Empty response from model")

    # DEBUG — comment out in production
    print("=" * 50)
    print("RAW GEMINI RESPONSE:")
    print(raw_news_text[:1000])
    print("=" * 50)

    parsed = parse_episode_response(raw_news_text)
    headline = parsed["headline"]
    description = parsed["description"]
    clean_news_text = clean_text_for_output(parsed["script"])

    print(f"PARSED HEADLINE: {headline}")
    print(f"PARSED DESCRIPTION: {description[:200]}")
    print("=" * 50)

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

    total_time = get_audio_duration(audio_path)

    transcript_data = {
        "date": datetime.utcnow().isoformat(),
        "genres": selected_genres,
        "states": selected_states,
        "headline": headline,
        "description": description,
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
        "headline": headline,
        "description": description,
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

        transcript_files = [f for f in os.listdir(TRANSCRIPTS_DIR) if f.endswith("_file.json")]
        total_episodes = len(transcript_files)

        return {"totalEpisodes": total_episodes}
    except Exception as e:
        print(f"Error counting episodes: {e}")
        return {"totalEpisodes": 1}


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