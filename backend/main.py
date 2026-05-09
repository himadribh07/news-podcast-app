import os
import re
import json
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from google import genai
from google.genai import types
from dotenv import load_dotenv
from gtts import gTTS
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import List, Optional
from mutagen.mp3 import MP3
import boto3

load_dotenv()

# R2 init
r2_client = boto3.client(
    "s3",
    endpoint_url=os.getenv("R2_ENDPOINT"),
    aws_access_key_id=os.getenv("R2_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("R2_SECRET_KEY"),
    region_name="auto",
)
R2_BUCKET = os.getenv("R2_BUCKET", "signal-newspodcast")
R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL", "").rstrip("/")

API_KEY = os.getenv("API_KEY", "").strip()
if not API_KEY:
    raise RuntimeError("API_KEY not set in environment")

client = genai.Client(api_key=API_KEY)

app = FastAPI(title="News Podcast API")

# ─── Server-side generation lock ─────────────────────────────────────────────
# Ensures only ONE Gemini call runs at a time across ALL clients/tabs/buttons.
_generate_lock = asyncio.Lock()
_is_generating = False          # exposed via /status so frontend can sync
# ─────────────────────────────────────────────────────────────────────────────

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
    """Check R2 for today's audio file. Returns data dict or None."""
    date_str = get_date_formatted()
    audio_filename = f"{date_str}_audio.mp3"
    transcript_filename = f"{date_str}_file.json"

    try:
        r2_client.head_object(Bucket=R2_BUCKET, Key=f"episodes/{audio_filename}")
        resp = r2_client.get_object(Bucket=R2_BUCKET, Key=f"transcripts/{transcript_filename}")
        transcript_data = json.loads(resp["Body"].read().decode("utf-8"))

        return {
            "audio_url": f"{R2_PUBLIC_URL}/episodes/{audio_filename}",
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
    except Exception:
        return None


def clean_inline(text: str) -> str:
    text = re.sub(
        r"^(SECTION\s*\d+\s*[—-]?\s*)?(HEADLINE|DESCRIPTION|SCRIPT)\s*[:.]?\s*",
        "", text, flags=re.IGNORECASE,
    )
    text = re.sub(r"^\d+\.\s*", "", text)
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"\*(.*?)\*", r"\1", text)
    text = re.sub(r"^#+\s*", "", text, flags=re.MULTILINE)
    return text.strip()


def parse_episode_response(raw_text: str) -> dict:
    headline = "Today's News"
    description = "Essential news briefing"
    script = raw_text.strip()

    parts = [p.strip() for p in raw_text.split("---") if p.strip()]
    if len(parts) >= 3:
        headline = clean_inline(parts[0])
        description = clean_inline(parts[1])
        script = parts[2] if len(parts) == 3 else "\n\n".join(parts[2:])
        script = re.sub(r"^#+\s*SCRIPT\s*", "", script, flags=re.IGNORECASE).strip()
        script = re.sub(r"^\d+\.\s*", "", script).strip()

    return {"headline": headline, "description": description, "script": script}


def parse_date_str(date_str: str) -> Optional[datetime]:
    try:
        if not date_str or "_" not in date_str:
            return None
        day_part, month_part = date_str.split("_", 1)
        day = int(re.sub(r"st|nd|rd|th", "", day_part))
        year = datetime.now().year
        return datetime.strptime(f"{month_part} {day} {year}", "%B %d %Y")
    except Exception as e:
        print(f"Failed to parse date_str '{date_str}': {e}")
        return None


def cleanup_old_episodes():
    try:
        print("\n[CLEANUP] Starting cleanup of episodes older than 14 days...")
        resp = r2_client.list_objects_v2(Bucket=R2_BUCKET, Prefix="transcripts/")
        contents = resp.get("Contents", [])
        if not contents:
            return

        now = datetime.now()
        fourteen_days_ago = now - timedelta(days=14)
        deleted_count = 0

        for obj in contents:
            key = obj["Key"]
            if not key.endswith(".json"):
                continue
            date_str = key.replace("transcripts/", "").replace("_file.json", "")
            episode_date = parse_date_str(date_str)
            if not episode_date:
                continue
            if episode_date < fourteen_days_ago:
                try:
                    r2_client.delete_object(Bucket=R2_BUCKET, Key=f"transcripts/{date_str}_file.json")
                    r2_client.delete_object(Bucket=R2_BUCKET, Key=f"episodes/{date_str}_audio.mp3")
                    deleted_count += 1
                    print(f"[CLEANUP] ✓ Deleted: {date_str}")
                except Exception as e:
                    print(f"[CLEANUP] Error deleting {date_str}: {e}")

        print(f"[CLEANUP] Done. Deleted {deleted_count} old episode(s).\n")
    except Exception as e:
        print(f"[CLEANUP] Error: {e}")


def build_prompt(genres: List[str], states: List[str]) -> str:
    genre_instructions = "".join(GENRE_BLOCKS[g] for g in genres if g in GENRE_BLOCKS)
    if "All States" in states or not states:
        state_info = "Include news from across all Indian states and union territories."
    else:
        state_info = f"PRIORITY: Focus on these states: {', '.join(states)}."

    today = datetime.now().strftime("%A, %d %B %Y")
    return f"""
You are a professional news editor writing today's daily briefing for {today}.

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


def call_gemini(prompt: str) -> str:
    """
    Call gemini-2.5-flash with Google Search grounding.
    Raises 429 on quota error, 500 on other errors.
    """
    try:
        print("[GEMINI] Calling gemini-2.5-flash...")
        resp = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[{"google_search": {}}]
            )
        )
        text = (resp.text or "").strip()
        if not text:
            raise HTTPException(status_code=500, detail="Empty response from model")
        print("[GEMINI] ✅ Success")
        return text

    except HTTPException:
        raise
    except Exception as e:
        err = str(e)
        print(f"[GEMINI] ❌ Error: {err}")
        if any(x in err for x in ["RESOURCE_EXHAUSTED", "429", "quota"]):
            raise HTTPException(status_code=429, detail="Quota exhausted. Please try again later.")
        raise HTTPException(status_code=500, detail=f"Model request failed: {e}")


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/status")
async def get_status():
    """
    Frontend polls this to know if generation is in progress.
    Used to keep ALL buttons on the page in sync.
    """
    existing = check_existing_audio()
    return {
        "generating": _is_generating,
        "cached": existing is not None,
        "cache": existing,
    }


@app.post("/generate")
async def generate_episode(req: GenerateRequest):
    """
    Generate today's news episode.
    - Always checks R2 cache first — returns instantly if cached.
    - Server-side lock ensures only ONE Gemini call runs at a time.
    - Any button/tab that hits this while generation is running gets a 202
      so the frontend knows to poll /status instead of firing another call.
    """
    global _is_generating

    # ── 1. Cache check first (always) ────────────────────────────────────────
    existing = check_existing_audio()
    if existing:
        print("[GENERATE] Cache hit — returning R2 episode.")
        return JSONResponse(existing)

    # ── 2. Lock check — reject duplicate concurrent requests ──────────────────
    if _generate_lock.locked():
        print("[GENERATE] Already generating — returning 202.")
        return JSONResponse(
            {"status": "generating", "message": "Episode generation already in progress. Poll /status."},
            status_code=202
        )

    # ── 3. Acquire lock and generate ─────────────────────────────────────────
    async with _generate_lock:
        _is_generating = True
        try:
            # Double-check cache inside lock (another request may have just finished)
            existing = check_existing_audio()
            if existing:
                print("[GENERATE] Cache hit inside lock — returning R2 episode.")
                return JSONResponse(existing)

            # Build genres/states
            if not req.genres or "ALL" in req.genres:
                selected_genres = ALL_GENRES
            else:
                selected_genres = [g for g in req.genres if g in ALL_GENRES] or ALL_GENRES

            selected_states = req.states or ["All States"]
            prompt = build_prompt(selected_genres, selected_states)

            # Call Gemini (with fallback)
            raw_news_text = call_gemini(prompt)

            print("=" * 50)
            print("RAW GEMINI RESPONSE:")
            print(raw_news_text[:1000])
            print("=" * 50)

            # Parse response
            parsed = parse_episode_response(raw_news_text)
            headline = parsed["headline"]
            description = parsed["description"]
            clean_news_text = clean_text_for_output(parsed["script"])

            print(f"PARSED HEADLINE: {headline}")
            print(f"PARSED DESCRIPTION: {description[:200]}")
            print("=" * 50)

            # TTS
            date_str = get_date_formatted()
            audio_filename = f"{date_str}_audio.mp3"
            transcript_filename = f"{date_str}_file.json"
            audio_path = os.path.join(OUTPUT_DIR, audio_filename)

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

            # Upload to R2
            try:
                r2_client.upload_file(audio_path, R2_BUCKET, f"episodes/{audio_filename}")
                audio_public_url = f"{R2_PUBLIC_URL}/episodes/{audio_filename}"

                r2_client.put_object(
                    Bucket=R2_BUCKET,
                    Key=f"transcripts/{transcript_filename}",
                    Body=json.dumps(transcript_data, indent=2).encode("utf-8"),
                    ContentType="application/json",
                )

                os.remove(audio_path)
                cleanup_old_episodes()

            except Exception as e:
                raise HTTPException(status_code=500, detail=f"R2 upload failed: {e}")

            return JSONResponse({
                "audio_url": audio_public_url,
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

        finally:
            _is_generating = False


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/episodes")
async def get_episodes():
    print("[/episodes] Called - fetching from R2...")
    try:
        resp = r2_client.list_objects_v2(Bucket=R2_BUCKET, Prefix="transcripts/")
        contents = resp.get("Contents", [])
        print(f"[/episodes] Found {len(contents)} objects in R2 transcripts/")

        episodes = []
        for obj in contents:
            key = obj["Key"]
            if not key.endswith(".json"):
                continue
            try:
                transcript_resp = r2_client.get_object(Bucket=R2_BUCKET, Key=key)
                transcript_data = json.loads(transcript_resp["Body"].read().decode("utf-8"))
                date_str = key.replace("transcripts/", "").replace("_file.json", "")
                episode = {
                    "date_str": date_str,
                    "num": len(episodes) + 1,
                    "headline": transcript_data.get("headline", ""),
                    "description": transcript_data.get("description", ""),
                    "audio_url": f"{R2_PUBLIC_URL}/episodes/{date_str}_audio.mp3",
                    "totalTime": transcript_data.get("totalTime", "--:--"),
                    "created_at": transcript_data.get("date", ""),
                }
                episodes.append(episode)
            except Exception as e:
                print(f"[/episodes] Error parsing {key}: {e}")
                continue

        episodes.sort(key=lambda ep: ep["created_at"])
        for i, ep in enumerate(episodes):
            ep["num"] = i + 1

        print(f"[/episodes] Returning {len(episodes)} episodes")
        return {"episodes": episodes}
    except Exception as e:
        print(f"[/episodes] Error: {e}")
        return {"episodes": []}


@app.get("/episode-count")
async def get_episode_count():
    try:
        resp = r2_client.list_objects_v2(Bucket=R2_BUCKET, Prefix="episodes/")
        count = len([o for o in resp.get("Contents", []) if o["Key"].endswith(".mp3")])
        return {"totalEpisodes": max(count, 1)}
    except Exception as e:
        print(f"Error counting episodes: {e}")
        return {"totalEpisodes": 1}


@app.get("/transcript/{date_str}")
async def get_transcript(date_str: str):
    transcript_filename = f"{date_str}_file.json"
    try:
        resp = r2_client.get_object(Bucket=R2_BUCKET, Key=f"transcripts/{transcript_filename}")
        return json.loads(resp["Body"].read().decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=404, detail=f"Transcript not found for {date_str}")


@app.get("/audio/{filename}")
async def get_audio(filename: str):
    path = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(path, media_type="audio/mpeg")