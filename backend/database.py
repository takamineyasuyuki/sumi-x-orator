"""
SUMI X Orator - Menu & Staff Database (v2)
Google Sheets with time-based caching for real-time admin sync.

Sheets:
  レギュラーメニュー: カテゴリ | メニュー名(日) | メニュー名(英) | メニュー説明(英) | 値段
                     | 写真URL | 味・特徴 | 量感 | アレルギー情報 | おすすめ組み合わせ | 備考
  スペシャルメニュー: 担当シェフ名 | カテゴリ | メニュー名(日) | メニュー名(英) | メニュー説明(英)
                     | 値段 | 写真URL | 味・特徴 | 量感 | おすすめフラグ | 常駐フラグ | 備考
  Staff: 出勤 | 名前 | リスペクト要素 | トークタグ
  店舗情報: 項目名 | 内容
  Ratings: timestamp | rating | message_count | lang
"""

from __future__ import annotations

import os
import json
import base64
import time
import logging
from typing import Optional

import gspread
from google.oauth2.service_account import Credentials

logger = logging.getLogger(__name__)

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]

CACHE_TTL = int(os.getenv("MENU_CACHE_TTL", "600"))  # seconds


class MenuDatabase:
    """Google Sheets menu & staff database with automatic refresh."""

    def __init__(self):
        creds = self._load_credentials()
        client = gspread.authorize(creds)
        sheet_id = os.getenv("GOOGLE_SHEET_ID", "")
        if not sheet_id:
            raise RuntimeError("GOOGLE_SHEET_ID is not set")
        self._spreadsheet = client.open_by_key(sheet_id)

        self._regular_sheet = self._spreadsheet.worksheet("レギュラーメニュー")
        self._special_sheet = self._get_or_create_sheet("スペシャルメニュー", cols=12)
        self._staff_sheet = self._get_or_create_sheet("Staff", cols=4)
        self._store_sheet = self._get_or_create_sheet("店舗情報", cols=2,
                                                       header=["項目名", "内容"])
        self._ratings_sheet = self._get_or_create_sheet("Ratings", cols=4,
                                                         header=["timestamp", "rating", "message_count", "lang"])

        self._regular_items: list[dict] = []
        self._special_items: list[dict] = []
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
        from datetime import datetime
        from zoneinfo import ZoneInfo
        now = datetime.now(ZoneInfo("America/Vancouver")).strftime("%Y-%m-%d %H:%M:%S")
        self._ratings_sheet.append_row([now, rating, message_count, lang])
        logger.info("Rating saved: %d stars", rating)

    # ------------------------------------------------------------------
    # Cache management
    # ------------------------------------------------------------------
    def refresh(self):
        """Fetch all rows from menu and staff sheets."""
        self._regular_items = self._regular_sheet.get_all_records()
        try:
            self._special_items = self._special_sheet.get_all_records()
        except Exception:
            logger.warning("Special menu sheet read failed, using empty list")
            self._special_items = []
        try:
            self._staff = self._staff_sheet.get_all_records()
        except Exception:
            logger.warning("Staff sheet read failed, using empty list")
            self._staff = []
        self._last_fetch = time.time()
        logger.info("Refreshed: %d regular, %d special, %d staff",
                     len(self._regular_items), len(self._special_items), len(self._staff))

    def refresh_if_stale(self):
        if time.time() - self._last_fetch > CACHE_TTL:
            try:
                self.refresh()
            except Exception:
                logger.warning("Refresh failed, serving stale cache")
                self._last_fetch = time.time()  # retry after TTL

    # ------------------------------------------------------------------
    # Regular menu
    # ------------------------------------------------------------------
    def get_regular_items(self) -> list[dict]:
        return self._regular_items

    def get_active_regular_items(self) -> list[dict]:
        """Return only regular items with 提供中 = TRUE."""
        return [
            item for item in self._regular_items
            if str(item.get("提供中", "")).upper() == "TRUE"
        ]

    # ------------------------------------------------------------------
    # Special menu
    # ------------------------------------------------------------------
    def get_special_items(self) -> list[dict]:
        return self._special_items

    def get_recommended_specials(self) -> list[dict]:
        """Return special items with おすすめフラグ = TRUE."""
        return [
            item for item in self._special_items
            if str(item.get("おすすめフラグ", "")).upper() == "TRUE"
        ]

    # ------------------------------------------------------------------
    # Combined menu operations
    # ------------------------------------------------------------------
    def get_all_items(self) -> list[dict]:
        return self._regular_items + self._special_items

    def find_mentioned_items(self, text: str) -> list[dict]:
        """Find menu items whose English names appear in the given text.
        Matches longer names first to avoid substring false positives
        (e.g. 'Daikon' matching inside 'Daikon Salad').
        """
        text_lower = text.lower()
        all_items = self._regular_items + self._special_items
        # Sort by name length descending so longer names match first
        candidates = sorted(
            [(item, item.get("メニュー名(英)", "")) for item in all_items if item.get("メニュー名(英)")],
            key=lambda x: len(x[1]),
            reverse=True,
        )
        results = []
        remaining = text_lower
        for item, name in candidates:
            name_lower = name.lower()
            if name_lower in remaining:
                results.append(item)
                # Remove matched name so shorter substrings don't false-match
                remaining = remaining.replace(name_lower, "", 1)
        return results

    # ------------------------------------------------------------------
    # Staff read operations (unchanged)
    # ------------------------------------------------------------------
    def get_working_staff(self) -> list[dict]:
        return [
            s for s in self._staff
            if str(s.get("出勤", "")).upper() == "TRUE"
        ]

    def get_staff_context(self) -> str:
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
    # Store info
    # ------------------------------------------------------------------
    def get_store_info(self) -> dict[str, str]:
        """Read all key-value pairs from 店舗情報 sheet."""
        try:
            records = self._store_sheet.get_all_records()
            return {r.get("項目名", ""): str(r.get("内容", "")) for r in records if r.get("項目名")}
        except Exception:
            logger.warning("Store info read failed")
            return {}

    def get_store_info_context(self) -> str:
        """Build text summary of store info for the AI prompt."""
        info = self.get_store_info()
        if not info:
            return "店舗情報はまだ登録されていません。"
        return "\n".join(f"- {k}: {v}" for k, v in info.items() if k != "talk_theme" and v)

    def get_config(self, key: str, default: str = "") -> str:
        """Read a value from 店舗情報 sheet by key."""
        info = self.get_store_info()
        return info.get(key, default)


    # ------------------------------------------------------------------
    # Availability (sold out tracking)
    # ------------------------------------------------------------------
    def get_availability(self) -> list[dict]:
        """Return メニュー名(英) + 提供中 for all menu items."""
        result = []
        for item in self._regular_items:
            name = item.get("メニュー名(英)", "")
            if name:
                available = str(item.get("提供中", "")).upper() == "TRUE"
                result.append({"メニュー名(英)": name, "提供中": available})
        for item in self._special_items:
            name = item.get("メニュー名(英)", "")
            if name:
                result.append({"メニュー名(英)": name, "提供中": True})
        return result

    def toggle_availability(self, menu_name: str, available: bool) -> bool:
        """Toggle 提供中 for a regular menu item."""
        return self._toggle_regular_field(menu_name, "提供中", available)

    def toggle_regular_flag(self, menu_name: str, flag: str, value: bool) -> bool:
        """Toggle おすすめフラグ for a regular menu item."""
        return self._toggle_regular_field(menu_name, flag, value)

    def _toggle_regular_field(self, menu_name: str, field: str, value: bool) -> bool:
        """Toggle a boolean field on the regular menu sheet."""
        header = self._regular_sheet.row_values(1)
        try:
            name_col_idx = header.index("メニュー名(英)") + 1
            field_col_idx = header.index(field) + 1
        except ValueError:
            logger.warning("Column not found: %s", field)
            return False
        name_values = self._regular_sheet.col_values(name_col_idx)
        for i, name in enumerate(name_values):
            if name == menu_name:
                row_num = i + 1
                self._regular_sheet.update_cell(row_num, field_col_idx, value)
                logger.info("Toggled %s %s -> %s", menu_name, field, value)
                return True
        logger.warning("Menu item not found for toggle: %s", menu_name)
        return False

    # ------------------------------------------------------------------
    # Special menu admin (staff UI)
    # ------------------------------------------------------------------
    def get_specials_for_staff(self) -> list[dict]:
        """Get special menu items for staff admin UI."""
        col_data = self._special_sheet.get_all_records()
        results = []
        for item in col_data:
            results.append({
                "担当シェフ名": item.get("担当シェフ名", ""),
                "カテゴリ": item.get("カテゴリ", ""),
                "メニュー名(英)": item.get("メニュー名(英)", ""),
                "メニュー名(日)": item.get("メニュー名(日)", ""),
                "値段": item.get("値段", ""),
                "おすすめフラグ": str(item.get("おすすめフラグ", "")).upper() == "TRUE",
                "常駐フラグ": str(item.get("常駐フラグ", "")).upper() == "TRUE",
            })
        return results

    def get_regular_for_staff(self) -> list[dict]:
        """Get regular menu items for staff admin UI with sold-out and recommend toggles."""
        return [
            {
                "カテゴリ": item.get("カテゴリ", ""),
                "メニュー名(英)": item.get("メニュー名(英)", ""),
                "メニュー名(日)": item.get("メニュー名(日)", ""),
                "値段": item.get("値段", ""),
                "提供中": str(item.get("提供中", "")).upper() == "TRUE",
                "おすすめフラグ": str(item.get("おすすめフラグ", "")).upper() == "TRUE",
            }
            for item in self._regular_items
        ]

    def toggle_special_flag(self, menu_name: str, flag: str, value: bool) -> bool:
        """Toggle おすすめフラグ or 常駐フラグ for a special menu item."""
        header = self._special_sheet.row_values(1)
        try:
            name_col_idx = header.index("メニュー名(英)") + 1  # 1-indexed
            flag_col_idx = header.index(flag) + 1
        except ValueError:
            logger.warning("Column not found: %s", flag)
            return False

        name_values = self._special_sheet.col_values(name_col_idx)
        for i, name in enumerate(name_values):
            if name == menu_name:
                row_num = i + 1
                self._special_sheet.update_cell(row_num, flag_col_idx, value)
                logger.info("Toggled %s %s -> %s", menu_name, flag, value)
                return True
        logger.warning("Special menu item not found: %s", menu_name)
        return False

    # ------------------------------------------------------------------
    # AI context builder
    # ------------------------------------------------------------------
    def get_menu_context(self) -> str:
        """Build a text summary for the AI system prompt."""
        lines: list[str] = []

        # Regular menu (active items only)
        regular = self.get_active_regular_items()
        if regular:
            categories: dict[str, list[dict]] = {}
            for item in regular:
                cat = item.get("カテゴリ", "その他")
                categories.setdefault(cat, []).append(item)

            lines.append("【レギュラーメニュー】")
            for cat, cat_items in categories.items():
                lines.append(f"\n[{cat}]")
                for item in cat_items:
                    parts = [f"- {item['メニュー名(英)']}"]
                    if item.get("値段"):
                        parts.append(f"${item['値段']}")
                    if item.get("メニュー説明(英)"):
                        parts.append(f"- {item['メニュー説明(英)']}")
                    if item.get("味・特徴"):
                        parts.append(f"({item['味・特徴']})")
                    if item.get("量感"):
                        parts.append(f"[{item['量感']}]")
                    if item.get("アレルギー情報"):
                        parts.append(f"(Allergens: {item['アレルギー情報']})")
                    if item.get("成分情報"):
                        parts.append(f"(Ingredients: {item['成分情報']})")
                    if item.get("おすすめ組み合わせ"):
                        parts.append(f"Pairs well: {item['おすすめ組み合わせ']}")
                    if item.get("備考"):
                        parts.append(f"※{item['備考']}")
                    recommended = str(item.get("おすすめフラグ", "")).upper() == "TRUE"
                    if recommended:
                        parts.append("[RECOMMENDED]")
                    lines.append(" ".join(parts))

        # Special menu
        specials = self._special_items
        if specials:
            lines.append("\n\n【スペシャルメニュー】")
            for item in specials:
                parts = [f"- {item.get('メニュー名(英)', '')}"]
                if item.get("値段"):
                    parts.append(f"${item['値段']}")
                if item.get("メニュー説明(英)"):
                    parts.append(f"- {item['メニュー説明(英)']}")
                if item.get("担当シェフ名"):
                    parts.append(f"[Chef: {item['担当シェフ名']}]")
                if item.get("味・特徴"):
                    parts.append(f"({item['味・特徴']})")
                if item.get("量感"):
                    parts.append(f"[{item['量感']}]")
                recommended = str(item.get("おすすめフラグ", "")).upper() == "TRUE"
                if recommended:
                    parts.append("[RECOMMENDED]")
                if item.get("備考"):
                    parts.append(f"※{item['備考']}")
                lines.append(" ".join(parts))

        if not lines:
            return "メニュー情報はまだ登録されていません。"

        return "\n".join(lines)
