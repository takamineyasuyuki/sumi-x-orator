"""
SUMI X Orator - Menu Database
Google Sheets with time-based caching for real-time admin sync.

Schema: id | name | category | price | description | allergens | chefs_note | image_url | is_active
"""

import os
import json
import base64
import time
import logging

import gspread
from google.oauth2.service_account import Credentials

logger = logging.getLogger(__name__)

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
]

CACHE_TTL = int(os.getenv("MENU_CACHE_TTL", "300"))  # seconds


class MenuDatabase:
    """Google Sheets menu database with automatic refresh."""

    def __init__(self):
        creds = self._load_credentials()
        client = gspread.authorize(creds)
        sheet_id = os.getenv("GOOGLE_SHEET_ID", "")
        if not sheet_id:
            raise RuntimeError("GOOGLE_SHEET_ID is not set")
        self.sheet = client.open_by_key(sheet_id).sheet1
        self._items: list[dict] = []
        self._last_fetch: float = 0
        self.refresh()
        logger.info("Connected to Google Sheet: %s", sheet_id)

    @staticmethod
    def _load_credentials() -> Credentials:
        raw_b64 = os.getenv("GOOGLE_SHEETS_CREDENTIALS_B64", "")
        if raw_b64:
            raw = base64.b64decode(raw_b64).decode("utf-8")
            info = json.loads(raw)
            return Credentials.from_service_account_info(info, scopes=SCOPES)

        raw = os.getenv("GOOGLE_SHEETS_CREDENTIALS", "")
        if raw:
            info = json.loads(raw)
            return Credentials.from_service_account_info(info, scopes=SCOPES)

        path = os.getenv("GOOGLE_SHEETS_CREDENTIALS_FILE", "")
        if path:
            return Credentials.from_service_account_file(path, scopes=SCOPES)

        raise RuntimeError(
            "Set GOOGLE_SHEETS_CREDENTIALS_B64, GOOGLE_SHEETS_CREDENTIALS, "
            "or GOOGLE_SHEETS_CREDENTIALS_FILE"
        )

    # ------------------------------------------------------------------
    # Cache management
    # ------------------------------------------------------------------
    def refresh(self):
        """Fetch all rows from the sheet."""
        self._items = self.sheet.get_all_records()
        self._last_fetch = time.time()
        logger.info("Menu refreshed: %d items", len(self._items))

    def refresh_if_stale(self):
        """Refresh data if the cache TTL has expired."""
        if time.time() - self._last_fetch > CACHE_TTL:
            self.refresh()

    # ------------------------------------------------------------------
    # Read operations
    # ------------------------------------------------------------------
    def get_all_items(self) -> list[dict]:
        return self._items

    def get_active_items(self) -> list[dict]:
        return [
            item for item in self._items
            if str(item.get("is_active", "")).upper() == "TRUE"
        ]

    def find_mentioned_items(self, text: str) -> list[dict]:
        """Find active menu items whose names appear in the given text."""
        text_lower = text.lower()
        return [
            item for item in self.get_active_items()
            if item.get("name", "") and item["name"].lower() in text_lower
        ]

    # ------------------------------------------------------------------
    # AI context builder
    # ------------------------------------------------------------------
    def get_menu_context(self) -> str:
        """Build a text summary for the AI system prompt."""
        items = self.get_active_items()
        if not items:
            return "No menu items registered yet."

        lines: list[str] = []
        for item in items:
            parts = [f"- {item['name']}"]
            if item.get("category"):
                parts.append(f"[{item['category']}]")
            if item.get("price") and float(item["price"]) > 0:
                parts.append(f"${item['price']}")
            if item.get("description") and item["description"] != "TBD":
                parts.append(f"- {item['description']}")
            if item.get("allergens"):
                parts.append(f"(Allergens: {item['allergens']})")
            if item.get("chefs_note"):
                parts.append(f"[Chef's note: {item['chefs_note']}]")
            lines.append(" ".join(parts))

        return "\n".join(lines)
