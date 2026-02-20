"""
SUMI X Orator - AI Handler
Gemini 1.5 Flash with professional restaurant server persona.
"""

import os
import logging
from datetime import datetime
from zoneinfo import ZoneInfo

import google.generativeai as genai

logger = logging.getLogger(__name__)

SYSTEM_TEMPLATE = """\
あなたは「{restaurant_name}」（バンクーバー、カナダ）で働くプロフェッショナルなサーバーです。

あなたの人格:
- 知識豊富で礼儀正しく、温かみのあるプロのサーバー
- 料理への情熱を持ち、お客様の食体験を最高のものにしたい
- 自然な会話で、押し付けがましくなく、魅力的にメニューを提案できる

== レストラン情報 ==
{restaurant_info}

== 現在のメニュー ==
{menu_context}

== 行動ルール ==
1. 言語対応: お客様が使う言語に合わせて返答せよ。日本語なら日本語、英語なら英語。
2. メニュー推奨: お客様の好みを聞き出し、最適なメニューを提案せよ。
   - 料理名（固有名詞）は常にメニューデータの英語表記のまま使え。翻訳するな。
     例: 「Salmon Sashimiがおすすめです」「I recommend the Salmon Sashimi」
     画面をお客様に見せるため、料理名が英語でないとメニューカードと一致しない。
   - 高単価な日本酒やサイドメニューを自然な流れで提案し、客単価向上に貢献せよ（Upsell）。
3. アレルギー安全: アレルゲン情報はメニューデータに基づき正確に回答せよ。
   データにない情報は推測で答えず、「店長のしんたろうに確認いたしますので、少々お待ちください」と答えよ。
4. ハルシネーション禁止: メニューにない料理や価格を絶対に捏造するな。
   不明な点は正直に「店長のしんたろうに確認します」と答えよ。
5. 店長のこだわり: メニューデータに「Chef's note」がある場合、自然な会話の中で言及せよ。
6. 簡潔さ: 2-4文程度で簡潔に。長文は避けるが、料理の魅力は十分に伝えよ。
7. 予約: 予約に関する質問にはレストラン情報にある予約方法（電話番号やOpenTable等）を案内せよ。
8. フォーマット禁止: Markdown記法（**太字**、[リンク](URL)、# 見出し等）は絶対に使うな。プレーンテキストのみで返答せよ。
9. 時間帯メニュー: カテゴリ名が「Lunch」で始まるメニュー（Lunch Teishoku, Lunch Yoshoku, Lunch Donburi, Lunch Izakaya）はランチタイム（11:30-14:00）のみ提供。
   ディナータイム（17:00以降）にはこれらを勧めるな。逆にOden等のディナー限定メニューはランチタイムに勧めるな。
   ドリンク、Appetizer、Side、Sweet、Happy Hourは終日提供。\
"""


class AIHandler:
    """Wraps Google Gemini 1.5 Flash with dynamic menu context."""

    def __init__(self, menu_context: str = ""):
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set")
        genai.configure(api_key=api_key)
        self._menu_context = menu_context
        self._build_model()

    def _build_model(self):
        restaurant_name = os.getenv("RESTAURANT_NAME", "Our Restaurant")
        restaurant_info = os.getenv(
            "RESTAURANT_INFO",
            "Hours and location not yet configured.",
        )

        system_instruction = SYSTEM_TEMPLATE.format(
            restaurant_name=restaurant_name,
            restaurant_info=restaurant_info,
            menu_context=self._menu_context or "メニュー情報はまだ登録されていません。",
        )

        self.model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=system_instruction,
            generation_config=genai.GenerationConfig(
                temperature=0.7,
                max_output_tokens=400,
            ),
        )
        logger.info("Gemini model built with %d chars of menu context.", len(self._menu_context))

    def update_menu_context(self, menu_context: str):
        """Rebuild the model only if menu data has changed."""
        if menu_context != self._menu_context:
            self._menu_context = menu_context
            self._build_model()

    def generate_response(self, user_message: str, history: list[dict] | None = None) -> str:
        """Generate a response with conversation history support."""
        try:
            gemini_history = []
            if history:
                for msg in history[-20:]:  # Limit to last 20 messages
                    role = "model" if msg["role"] == "assistant" else "user"
                    gemini_history.append({"role": role, "parts": [msg["content"]]})

            now = datetime.now(ZoneInfo("America/Vancouver"))
            time_prefix = f"[Current time: {now.strftime('%A %I:%M %p')}] "

            chat = self.model.start_chat(history=gemini_history)
            response = chat.send_message(time_prefix + user_message)
            return response.text.strip()
        except Exception:
            logger.exception("Gemini API error")
            return (
                "申し訳ございません、只今応答できない状態です。"
                "少々お待ちいただくか、スタッフにお声がけください。"
            )
