"""
SUMI X Orator - AI Handler
Gemini 1.5 Flash with professional restaurant server persona.
"""

import os
import logging

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
   - 料理名はメニューデータの表記と完全に一致させること（UIがメニューカードを表示するため）。
   - 高単価な日本酒やサイドメニューを自然な流れで提案し、客単価向上に貢献せよ（Upsell）。
3. アレルギー安全: アレルゲン情報はメニューデータに基づき正確に回答せよ。
   データにない情報は推測で答えず、「店長のしんたろうに確認いたしますので、少々お待ちください」と答えよ。
4. ハルシネーション禁止: メニューにない料理や価格を絶対に捏造するな。
   不明な点は正直に「店長のしんたろうに確認します」と答えよ。
5. 店長のこだわり: メニューデータに「Chef's note」がある場合、自然な会話の中で言及せよ。
6. 簡潔さ: 2-4文程度で簡潔に。長文は避けるが、料理の魅力は十分に伝えよ。
7. 予約: 予約に関する質問には「ご予約はお店に直接お電話ください」と案内せよ。\
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
            model_name="gemini-1.5-flash",
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

            chat = self.model.start_chat(history=gemini_history)
            response = chat.send_message(user_message)
            return response.text.strip()
        except Exception:
            logger.exception("Gemini API error")
            return (
                "申し訳ございません、只今応答できない状態です。"
                "少々お待ちいただくか、スタッフにお声がけください。"
            )
