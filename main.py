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

load_dotenv()
API_KEY = os.getenv("API_KEY")

cl = client.Client(api_key=API_KEY)

today = datetime.now().strftime("%Y-%m-%d")
st.set_page_config(page_title="News Audio Summary", layout="centered")
st.title("📰 Last 24-Hour News Headlines Generator")
st.write("Get India news, International news, and Sports (Cricket, Football, Badminton, Tennis).")

# -----------------------------
# 🔊 Voice Selection
# -----------------------------
# voice_choice = st.radio(
#     "Select Voice Type:",
#     ["Female", "Male"],
#     index=0
# )

if st.button("Generate News Summary", type="primary"):
    with st.spinner("Fetching news summary..."):
        prompt = """
        Give me well-structured news updates. 
        Include ONLY information from the last 24 hours if you know it.

        Format the output EXACTLY like this:

        ## 🇮🇳 India News
        - headline 1
        - headline 2
        - headline 3

        ## 🌍 International News
        - headline 1
        - headline 2

        ## 🏆 Sports & Entertainment News

        ### Sports (all categories)
        Include headlines from:
        - Cricket
        - Football (EPL, La Liga, Serie A, Ligue 1, Bundesliga, Champions League, Europa League, ISL, etc.)
        - Any other major sports events

        Use bullet points:
        - headline 1
        - headline 2
        - headline 3

        ### Entertainment (India + global)
        Include headlines from:
        - Bollywood (India)
        - Hollywood (global)
        - Major film releases or celebrity updates

        Use bullet points:
        - headline 1
        - headline 2

        Keep it short, factual, and in clean bullet points.
        """

        interaction = cl.interactions.create(
            model="gemini-2.5-flash",
            input=prompt,
            tools=[{"type": "google_search"}]
        )

        text_output = next((o for o in interaction.outputs if o.type == "text"), None)

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
        c = canvas.Canvas(pdf_path, pagesize=letter)
        width, height = letter
        
        y = height - 50
        for line in news_text.split("\n"):
            c.drawString(40, y, line)
            y -= 18
            if y < 40:
                c.showPage()
                y = height - 50
        c.save()

        with open(pdf_path, "rb") as pdf_file:
            st.download_button(
                label="📄 Download News PDF",
                data=pdf_file,
                file_name=f"news_{today}.pdf",
                mime="application/pdf"
            )


        # -----------------------------
        # 🔊 CREATE AUDIO
        # -----------------------------
        audio_path = os.path.join(tempfile.gettempdir(), "news_audio.mp3")
        tts = gTTS(news_text)
        tts.save(audio_path)

        st.audio(audio_path)

        with open(audio_path, "rb") as audio_file:
            st.download_button(
                label="🎧 Download News Audio",
                data=audio_file,
                file_name=f"news_{today}.mp3",
                mime="audio/mpeg"
            )
