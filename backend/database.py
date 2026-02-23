"""
SUMI X Orator - Menu & Staff Database
Google Sheets with time-based caching for real-time admin sync.

Menu schema: 提供中 | メニュー名 | カテゴリー | 担当シェフ | 魅力・特徴 | アレルギー・注意 | 価格
Staff schema: 出勤 | 名前 | リスペクト要素 | トークタグ
Config schema: key | value
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
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]

CACHE_TTL = int(os.getenv("MENU_CACHE_TTL", "300"))  # seconds


class MenuDatabase:
    """Google Sheets menu & staff database with automatic refresh."""

    def __init__(self):
        creds = self._load_credentials()
        client = gspread.authorize(creds)
        sheet_id = os.getenv("GOOGLE_SHEET_ID", "")
        if not sheet_id:
            raise RuntimeError("GOOGLE_SHEET_ID is not set")
        self._spreadsheet = client.open_by_key(sheet_id)
        self._menu_sheet = self._spreadsheet.worksheet("Menu")
        self._staff_sheet = self._get_or_create_sheet("Staff", cols=4)
        self._config_sheet = self._get_or_create_sheet("Config", cols=2, header=["key", "value"])
        self._ratings_sheet = self._get_or_create_sheet("Ratings", cols=4,
                                                         header=["timestamp", "rating", "message_count", "lang"])
        self._menu_items: list[dict] = []
        self._staff: list[dict] = []
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

    def _get_or_create_sheet(self, title: str, cols: int = 4, header: list[str] | None = None):
        """Get or create a worksheet by title."""
        try:
            return self._spreadsheet.worksheet(title)
        except gspread.WorksheetNotFound:
            ws = self._spreadsheet.add_worksheet(title, rows=1000, cols=cols)
            if header:
                ws.append_row(header)
            logger.info("Created %s sheet tab.", title)
            return ws

    # ------------------------------------------------------------------
    # Ratings
    # ------------------------------------------------------------------
    def save_rating(self, rating: int, message_count: int = 0, lang: str = ""):
        """Save a customer rating (1-5) to the Ratings sheet."""
        from datetime import datetime
        from zoneinfo import ZoneInfo
        now = datetime.now(ZoneInfo("America/Vancouver")).strftime("%Y-%m-%d %H:%M:%S")
        self._ratings_sheet.append_row([now, rating, message_count, lang])
        logger.info("Rating saved: %d stars", rating)

    # ------------------------------------------------------------------
    # Cache management
    # ------------------------------------------------------------------
    def refresh(self):
        """Fetch all rows from Menu and Staff sheets."""
        self._menu_items = self._menu_sheet.get_all_records()
        try:
            self._staff = self._staff_sheet.get_all_records()
        except Exception:
            logger.warning("Staff sheet read failed, using empty list")
            self._staff = []
        self._last_fetch = time.time()
        logger.info("Refreshed: %d menu items, %d staff", len(self._menu_items), len(self._staff))

    def refresh_if_stale(self):
        """Refresh data if the cache TTL has expired."""
        if time.time() - self._last_fetch > CACHE_TTL:
            self.refresh()

    # ------------------------------------------------------------------
    # Menu read operations
    # ------------------------------------------------------------------
    def get_all_items(self) -> list[dict]:
        return self._menu_items

    def get_active_items(self) -> list[dict]:
        return [
            item for item in self._menu_items
            if str(item.get("提供中", "")).upper() == "TRUE"
        ]

    def find_mentioned_items(self, text: str) -> list[dict]:
        """Find active menu items whose names appear in the given text."""
        text_lower = text.lower()
        return [
            item for item in self.get_active_items()
            if item.get("メニュー名", "") and item["メニュー名"].lower() in text_lower
        ]

    # ------------------------------------------------------------------
    # Staff read operations
    # ------------------------------------------------------------------
    def get_working_staff(self) -> list[dict]:
        """Return staff members currently on shift."""
        return [
            s for s in self._staff
            if str(s.get("出勤", "")).upper() == "TRUE"
        ]

    def get_staff_context(self) -> str:
        """Build a text summary of working staff for the AI prompt, including talk tags."""
        working = self.get_working_staff()
        if not working:
            return "今日の出勤スタッフ情報はまだ登録されていません。"
        lines = []
        for s in working:
            name = s.get("名前", "")
            respect = s.get("リスペクト要素", "")
            tags = s.get("トークタグ", "")
            if name:
                line = f"- {name}"
                if respect:
                    line += f": {respect}"
                if tags:
                    line += f" [話題タグ: {tags}]"
                lines.append(line)
        return "今日の出勤スタッフ:\n" + "\n".join(lines)

    # ------------------------------------------------------------------
    # Config
    # ------------------------------------------------------------------
    def get_config(self, key: str, default: str = "") -> str:
        """Read a value from the Config sheet by key."""
        try:
            records = self._config_sheet.get_all_records()
            for r in records:
                if r.get("key") == key:
                    return str(r.get("value", default))
        except Exception:
            logger.warning("Config read failed for key=%s", key)
        return default

    def get_talk_theme(self) -> str:
        """Get the current weekly talk theme."""
        return self.get_config("talk_theme", "")

    # ------------------------------------------------------------------
    # Lightweight availability (polling - columns A+B only)
    # ------------------------------------------------------------------
    def get_availability(self) -> list[dict]:
        """Fetch only 提供中 + メニュー名 columns for minimal payload polling."""
        col_a = self._menu_sheet.col_values(1)  # 提供中
        col_b = self._menu_sheet.col_values(2)  # メニュー名
        # Skip header row, zip columns
        result = []
        for i in range(1, max(len(col_a), len(col_b))):
            name = col_b[i] if i < len(col_b) else ""
            active = col_a[i] if i < len(col_a) else ""
            if name:
                result.append({"メニュー名": name, "提供中": active.upper() == "TRUE"})
        return result

    def toggle_availability(self, menu_name: str, available: bool):
        """Set 提供中 (column A) for a specific menu item by name."""
        col_b = self._menu_sheet.col_values(2)  # メニュー名
        for i, name in enumerate(col_b):
            if name == menu_name:
                row_num = i + 1  # 1-indexed
                self._menu_sheet.update_cell(row_num, 1, "TRUE" if available else "FALSE")
                logger.info("Toggled %s -> %s", menu_name, available)
                return True
        logger.warning("Menu item not found for toggle: %s", menu_name)
        return False

    def get_all_items_for_staff(self) -> list[dict]:
        """Get メニュー名 + カテゴリー + 提供中 for the staff admin UI."""
        col_a = self._menu_sheet.col_values(1)  # 提供中
        col_b = self._menu_sheet.col_values(2)  # メニュー名
        col_c = self._menu_sheet.col_values(3)  # カテゴリー
        result = []
        for i in range(1, max(len(col_a), len(col_b), len(col_c))):
            name = col_b[i] if i < len(col_b) else ""
            active = col_a[i] if i < len(col_a) else ""
            cat = col_c[i] if i < len(col_c) else ""
            if name:
                result.append({
                    "メニュー名": name,
                    "カテゴリー": cat,
                    "提供中": active.upper() == "TRUE",
                })
        return result

    # ------------------------------------------------------------------
    # AI context builder
    # ------------------------------------------------------------------
    def get_menu_context(self) -> str:
        """Build a text summary for the AI system prompt."""
        items = self.get_active_items()
        if not items:
            return "メニュー情報はまだ登録されていません。"

        # Group by category
        categories: dict[str, list[dict]] = {}
        for item in items:
            cat = item.get("カテゴリー", "その他")
            categories.setdefault(cat, []).append(item)

        lines: list[str] = []
        for cat, cat_items in categories.items():
            lines.append(f"\n[{cat}]")
            for item in cat_items:
                parts = [f"- {item['メニュー名']}"]
                if item.get("価格") and float(item["価格"]) > 0:
                    parts.append(f"${item['価格']}")
                if item.get("魅力・特徴"):
                    parts.append(f"- {item['魅力・特徴']}")
                if item.get("担当シェフ"):
                    parts.append(f"[Chef: {item['担当シェフ']}]")
                if item.get("アレルギー・注意"):
                    parts.append(f"(Allergens: {item['アレルギー・注意']})")
                lines.append(" ".join(parts))

        return "\n".join(lines)
