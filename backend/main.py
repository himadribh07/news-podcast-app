from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from google.genai import client
from dotenv import load_dotenv
from gtts import gTTS
from datetime import datetime
import os
import tempfile
import re
from typing import List, Optional

load_dotenv()
API_KEY = os.getenv("API_KEY")
if not API_KEY:
    raise RuntimeError("API_KEY not set in environment")

cl = client.Client(api_key=API_KEY)

app = FastAPI(title="News Podcast API")

# Allow local frontend origin — adjust as needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# directory to store generated assets
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(OUTPUT_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=OUTPUT_DIR), name="static")


def clean_text_for_output(text: str) -> str:
    """
    Removes Markdown formatting and special characters for TTS usage.
    """
    text = re.sub(r"^#+\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"\*(.*?)\*", r"\1", text)
    text = re.sub(r"\*", "", text)
    text = re.sub(r"^\s*-\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"[#@&]", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


@app.post("/generate")
async def generate_episode(
    genres: Optional[List[str]] = None,
    states: Optional[List[str]] = None,
    include_pdf: bool = False,
):
    """
    Generate a short news audio summary based on optional genres and states.
    Returns JSON with `audio_url` (served under /static) and optional `pdf_url`.
    """
    # default genre list
    all_genres = [
        "Front Page / Breaking News",
        "International News",
        "Politics",
        "Finance",
        "Sports",
        "Entertainment",
        "Technology",
        "Health",
    ]

    if not genres:
        selected_genres = all_genres
    else:
        if "ALL" in genres:
            selected_genres = all_genres
        else:
            selected_genres = [g for g in genres if g in all_genres]

    selected_states = states or ["All States"]

    # Build prompt
    genre_instructions = []
    if "Front Page / Breaking News" in selected_genres:
        genre_instructions.append(
            """
            ## Front Page / Breaking News (India-focused)
            - Include the most important national or global breaking stories from the last 24 hours
            - Government decisions, emergencies, major incidents
            """
        )
    if "Politics" in selected_genres:
        genre_instructions.append(
            """
            ## Politics
            - Indian politics only
            - Government decisions, elections, policy changes, parliament updates
            """
        )
    if "Finance" in selected_genres:
        genre_instructions.append(
            """
            ## Finance
            - Indian markets, RBI updates, inflation, startups, major corporate news
            """
        )
    if "Sports" in selected_genres:
        genre_instructions.append(
            """
            ## Sports
            - Cricket (India priority)
            - Football (major leagues only)
            - Any major international sports events
            """
        )
    if "Entertainment" in selected_genres:
        genre_instructions.append(
            """
            ## Entertainment
            - Bollywood first
            - Major Hollywood or global entertainment news
            """
        )
    if "Technology" in selected_genres:
        genre_instructions.append(
            """
            ## Technology
            - Indian tech startups and companies
            - Major tech announcements, AI, cyber security
            - Innovation and digital transformation
            """
        )
    if "Health" in selected_genres:
        genre_instructions.append(
            """
            ## Health
            - Health policy updates, disease prevention
            - Medical breakthroughs and research
            - Public health alerts and wellness news
            """
        )

    if "All States" not in selected_states:
        state_list = ", ".join(selected_states)
        state_info = f"PRIORITY: Focus on these states: {state_list}."
    else:
        state_info = "Include news from across all Indian states and unions."

    prompt = f"""
    You are a professional news editor.

    Give me factual, concise news items from the last 24 hours only.

    Formatting rules (STRICT):
    - Use bullet points only
    - Each bullet must be:
    - **Headline** — one-line factual detail
    - One-line detail must explain what happened or why it matters
    - Max 20–25 words per detail
    - No opinions, no speculation, no repetition
    - Clean, neutral tone suitable for audio narration

    {''.join(genre_instructions)}
    {state_info}
    """

    try:
        interaction = cl.interactions.create(
            model="gemini-2.5-flash",
            input=prompt,
            tools=[{"type": "google_search"}],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model request failed: {e}")

    text_output = next((o for o in interaction.outputs if o.type == "text"), None)
    if not text_output:
        raise HTTPException(status_code=500, detail="No text output from model")

    raw_news_text = text_output.text
    clean_news_text = clean_text_for_output(raw_news_text)

    # create audio
    audio_filename = f"news_{datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')}.mp3"
    audio_path = os.path.join(OUTPUT_DIR, audio_filename)
    try:
        tts = gTTS(clean_news_text)
        tts.save(audio_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS failed: {e}")

    result = {"audio_url": f"/static/{audio_filename}", "date": datetime.utcnow().isoformat()}

    # Optionally create PDF (not implemented fully here)
    if include_pdf:
        pdf_filename = f"news_{datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')}.pdf"
        pdf_path = os.path.join(OUTPUT_DIR, pdf_filename)
        # Minimal PDF generation could be added here if needed.
        result["pdf_url"] = f"/static/{pdf_filename}"

    return JSONResponse(result)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/audio/{filename}")
async def get_audio(filename: str):
    path = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(path, media_type="audio/mpeg")
