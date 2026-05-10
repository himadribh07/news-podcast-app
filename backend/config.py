from datetime import datetime
from typing import List

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


def build_prompt(genres: List[str], states: List[str]) -> str:
    genre_instructions = "".join(GENRE_BLOCKS[g] for g in genres if g in GENRE_BLOCKS)
    if "All States" in states or not states:
        state_info = "Include news from across all Indian states and union territories."
    else:
        state_info = f"PRIORITY: Focus on these states: {', '.join(states)}."

    today = datetime.now().strftime("%A, %d %B %Y")
    return f"""
You are a professional news editor writing today's daily briefing for {today}. Your goal is to include ONLY legit news stories that have actually happened in the last 24 hours. Do NOT make up any news or details.

OUTPUT FORMAT — STRICT:
You MUST output exactly 3 sections separated by "---" on its own line.

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
News organized by category. Each section lists ONLY headlines with 1-line explanation (NOT full paragraphs).

Format STRICTLY as:
## Category Name
- **Headline 1** — One sentence explanation
- **Headline 2** — One sentence explanation
- **Headline 3** — One sentence explanation

General rules (STRICT):
- Last 24 hours only — NO older news
- ONE sentence explanation per headline only
- Bullet points only
- No opinions, no speculation
- Clean, neutral tone for audio narration

{genre_instructions}
{state_info}
"""
