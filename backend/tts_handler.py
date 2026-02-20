"""
SUMI X Orator - TTS Handler
Google Cloud Text-to-Speech with Neural2 voices.
"""

import os
import json
import base64
import logging

from google.cloud import texttospeech
from google.oauth2.service_account import Credentials

logger = logging.getLogger(__name__)

# Natural-sounding Neural2 voices per language
VOICE_MAP = {
    "ja-JP": {"name": "ja-JP-Neural2-B", "language_code": "ja-JP"},
    "en-US": {"name": "en-US-Neural2-F", "language_code": "en-US"},
    "ko-KR": {"name": "ko-KR-Neural2-A", "language_code": "ko-KR"},
    "zh-CN": {"name": "cmn-CN-Neural2-A", "language_code": "cmn-CN"},
    "es-ES": {"name": "es-ES-Neural2-A", "language_code": "es-ES"},
    "pt-BR": {"name": "pt-BR-Neural2-A", "language_code": "pt-BR"},
}


class TTSHandler:
    """Google Cloud Text-to-Speech with Neural2 voices."""

    def __init__(self):
        creds = self._load_credentials()
        self.client = texttospeech.TextToSpeechClient(credentials=creds)
        logger.info("Google Cloud TTS client initialized.")

    @staticmethod
    def _load_credentials() -> Credentials:
        raw_b64 = os.getenv("GOOGLE_SHEETS_CREDENTIALS_B64", "")
        if raw_b64:
            raw = base64.b64decode(raw_b64).decode("utf-8")
            info = json.loads(raw)
            return Credentials.from_service_account_info(info)

        raw = os.getenv("GOOGLE_SHEETS_CREDENTIALS", "")
        if raw:
            info = json.loads(raw)
            return Credentials.from_service_account_info(info)

        path = os.getenv("GOOGLE_SHEETS_CREDENTIALS_FILE", "")
        if path:
            return Credentials.from_service_account_file(path)

        raise RuntimeError("No Google credentials found for TTS")

    def synthesize(self, text: str, lang: str = "ja-JP") -> bytes:
        """Convert text to speech audio (MP3)."""
        voice_config = VOICE_MAP.get(lang, VOICE_MAP["en-US"])

        response = self.client.synthesize_speech(
            input=texttospeech.SynthesisInput(text=text),
            voice=texttospeech.VoiceSelectionParams(
                language_code=voice_config["language_code"],
                name=voice_config["name"],
            ),
            audio_config=texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=1.0,
                pitch=0.0,
            ),
        )
        return response.audio_content
