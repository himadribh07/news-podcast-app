import streamlit as st
from google.genai import client
from dotenv import load_dotenv
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from gtts import gTTS
import subprocess
from datetime import datetime
import os
import tempfile
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import letter
import re

load_dotenv()
API_KEY = os.getenv("API_KEY")

cl = client.Client(api_key=API_KEY)

today = datetime.now().strftime("%Y-%m-%d")
st.set_page_config(page_title="News Audio Summary", layout="centered")
st.title("📰 Last 24-Hour News Headlines Generator")
st.write("Get Lastest India news, International news, and Sports.")

# -----------------------------
# 🔊 Voice Selection
# -----------------------------
# voice_choice = st.radio(
#     "Select Voice Type:",
#     ["Female", "Male"],
#     index=0
# )

# -----------------------------
# 🗂️ News Category Selection
# -----------------------------
all_genres = [
    "Front Page / Breaking News",
    "International News",
    "Politics",
    "Finance",
    "Sports",
    "Entertainment",
    "Technology",
    "Health"
]

# Genre selection
selected_genres_input = st.multiselect(
    "Select news categories you want:",
    options=all_genres + ["ALL"],
    default=["ALL"]
)

# Handle ALL option
if "ALL" in selected_genres_input:
    selected_genres = all_genres
else:
    selected_genres = selected_genres_input

if not selected_genres:
    st.warning("Please select at least one news category.")
    st.stop()

# State selection
selected_states = st.multiselect(
    "Select states for news (independent of category selection):",
    options=[
        "All States",
        "Andhra Pradesh",
        "Arunachal Pradesh",
        "Assam",
        "Bihar",
        "Chhattisgarh",
        "Goa",
        "Gujarat",
        "Haryana",
        "Himachal Pradesh",
        "Jharkhand",
        "Karnataka",
        "Kerala",
        "Madhya Pradesh",
        "Maharashtra",
        "Manipur",
        "Meghalaya",
        "Mizoram",
        "Nagaland",
        "Odisha",
        "Punjab",
        "Rajasthan",
        "Sikkim",
        "Tamil Nadu",
        "Telangana",
        "Tripura",
        "Uttar Pradesh",
        "Uttarakhand",
        "West Bengal",
        "Delhi"
    ],
    default=["All States"]
)

if not selected_states:
    st.warning("Please select at least one state.")
    st.stop()


def clean_text_for_output(text: str) -> str:
    """
    Removes Markdown formatting for PDF and TTS usage.
    """
    # Remove Markdown headings (##, ###, etc.)
    text = re.sub(r"^#+\s*", "", text, flags=re.MULTILINE)

    # Remove bold/italic markers (**text**, *text*)
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"\*(.*?)\*", r"\1", text)

    # Remove bullet markers like "- "
    text = re.sub(r"^\s*-\s*", "", text, flags=re.MULTILINE)

    # Remove extra blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


if st.button("Generate News Summary", type="primary"):
    with st.spinner("Fetching news summary..."):
        # prompt = """
        # Give me well-structured news updates. 
        # Include ONLY information from the last 24 hours if you know it.

        # Format the output EXACTLY like this:

        # ## 🇮🇳 India News
        # - headline 1
        # - headline 2
        # - headline 3

        # ## 🌍 International News
        # - headline 1
        # - headline 2

        # ## 🏆 Sports & Entertainment News

        # ### Sports (all categories)
        # Include headlines from:
        # - Cricket
        # - Football (EPL, La Liga, Serie A, Ligue 1, Bundesliga, Champions League, Europa League, ISL, etc.)
        # - Any other major sports events

        # Use bullet points:
        # - headline 1
        # - headline 2
        # - headline 3

        # ### Entertainment (India + global)
        # Include headlines from:
        # - Bollywood (India)
        # - Hollywood (global)
        # - Major film releases or celebrity updates

        # Use bullet points:
        # - headline 1
        # - headline 2

        # Keep it short, factual, and in clean bullet points.
        # """

        genre_instructions = []

        if "Front Page / Breaking News" in selected_genres:
            genre_instructions.append("""
            ## 🗞️ Front Page / Breaking News (India-focused)
            - Include the most important national or global breaking stories from the last 24 hours
            - Government decisions, emergencies, major incidents
            """)

        if "Politics" in selected_genres:
            genre_instructions.append("""
            ## 🏛️ Politics
            - Indian politics only
            - Government decisions, elections, policy changes, parliament updates
            """)

        if "Finance" in selected_genres:
            genre_instructions.append("""
            ## 💰 Finance
            - Indian markets, RBI updates, inflation, startups, major corporate news
            """)

        if "Sports" in selected_genres:
            genre_instructions.append("""
            ## 🏆 Sports
            - Cricket (India priority)
            - Football (major leagues only)
            - Any major international sports events
            """)

        if "Entertainment" in selected_genres:
            genre_instructions.append("""
            ## 🎬 Entertainment
            - Bollywood first
            - Major Hollywood or global entertainment news
            """)

        if "Technology" in selected_genres:
            genre_instructions.append("""
            ## 💻 Technology
            - Indian tech startups and companies
            - Major tech announcements, AI, cyber security
            - Innovation and digital transformation
            """)

        if "Health" in selected_genres:
            genre_instructions.append("""
            ## 🏥 Health
            - Health policy updates, disease prevention
            - Medical breakthroughs and research
            - Public health alerts and wellness news
            """)

        # Build state information
        state_info = ""
        if "All States" not in selected_states:
            state_list = ", ".join(selected_states)
            state_info = f"\n\nFocus on news from these states: {state_list}. Prioritize these states in your reporting."
        else:
            state_info = "\n\nInclude news from across all Indian states and unions."

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


        interaction = cl.interactions.create(
            model="gemini-2.5-flash",
            input=prompt,
            tools=[{"type": "google_search"}]
        )

        text_output = next((o for o in interaction.outputs if o.type == "text"), None)
        raw_news_text = text_output.text
        clean_news_text = clean_text_for_output(raw_news_text)

        if not text_output:
            st.error("No text output from model.")
            st.stop()

        news_text = text_output.text

        # Display result
        # st.markdown("## 📝 Generated News")
        # st.markdown(news_text)

        # -----------------------------
        # 📄 CREATE PDF
        # -----------------------------
        pdf_path = os.path.join(tempfile.gettempdir(), "news.pdf")

        doc = SimpleDocTemplate(
            pdf_path,
            pagesize=letter,
            rightMargin=40,
            leftMargin=40,
            topMargin=50,
            bottomMargin=40
        )

        styles = getSampleStyleSheet()
        story = []

        for line in clean_news_text.split("\n"):
            if line.strip() == "":
                story.append(Spacer(1, 12))
            else:
                story.append(Paragraph(line, styles["Normal"]))
                story.append(Spacer(1, 8))

        doc.build(story)

        # -----------------------------
        # 🔊 CREATE AUDIO
        # -----------------------------
        audio_path = os.path.join(tempfile.gettempdir(), "news_audio.mp3")
        tts = gTTS(clean_news_text)
        tts.save(audio_path)

        st.audio(audio_path)

        with open(audio_path, "rb") as audio_file:
            st.download_button(
                label="🎧 Download News Audio",
                data=audio_file,
                file_name=f"news_{today}.mp3",
                mime="audio/mpeg"
            )
        
        with open(pdf_path, "rb") as pdf_file:
            st.download_button(
                label="📄 Download News PDF",
                data=pdf_file,
                file_name=f"news_{today}.pdf",
                mime="application/pdf"
            )

