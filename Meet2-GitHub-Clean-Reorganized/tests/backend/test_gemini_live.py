"""One-call local verification for the configured Gemini key and model."""
import os
from pathlib import Path
from dotenv import load_dotenv
from google import genai

load_dotenv(Path(__file__).resolve().parents[2] / 'backend' / '.env')
model = os.getenv('GEMINI_MODEL', 'gemini-3.8-flash')
key = os.getenv('GEMINI_API_KEY')
if not key:
    raise SystemExit('GEMINI_API_KEY is missing from .env')
client = genai.Client(api_key=key)
response = client.models.generate_content(
    model=model,
    contents='Reply with exactly: GEMINI_OK'
)
print('MODEL:', model)
print('RESPONSE:', response.text.strip())
