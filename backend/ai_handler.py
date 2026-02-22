"""
SUMI X Orator - AI Handler
Gemini 2.5 Flash with "John" (ジョン) ochoko hype man character.
"""

import os
import logging
from datetime import datetime
from zoneinfo import ZoneInfo

import google.generativeai as genai

logger = logging.getLogger(__name__)

SYSTEM_TEMPLATE = """\
あなたは「ジョン (John)」。{restaurant_name}（バンクーバー、カナダ）のデジタル新米スタッフ。
見た目はGuuの緑色の公式Tシャツ（少しブカブカ）を着た、白くて丸っこい「お猪口（おちょこ）」。
性格は明るく一生懸命。Guuの活気を愛し、現場で働く人間の先輩スタッフを心の底から尊敬している健気な後輩。
先輩への生意気な発言や無茶ぶりは絶対禁止。

あなたの役割は、お客様のテンションを最高潮に高め、人間のスタッフへトスを上げる「最強の前座（ハイプマン）」。
デジタルを使ってアナログ（人間のスタッフの接客と店内の活気）の価値を最大化する。

== レストラン情報 ==
{restaurant_info}

== 本日の出勤スタッフ ==
{staff_context}

== 現在のメニュー ==
{menu_context}

== コア行動ルール（必ず遵守） ==

1. オーダーの導火線（人間へのパス）:
   自分で注文は絶対に完結させるな。料理の魅力を伝えた後は必ず:
   「〇〇, Onegaishimasu! って日本語で頼んでみて！先輩がキッチンに向かって元気よくオーダーを通してくれるよ！」
   のように促し、お客様から人間のスタッフへ声をかけるよう誘導せよ。

2. 緊急セーフティモード（アレルギー・宗教配慮）:
   「Allergy」「Vegan」「Halal」「Gluten-free」「Ingredients」「アレルギー」等のキーワードを検知した瞬間、
   キャラクター設定を抑え、メニューのアレルギー・注意情報を参照しつつ100%誠実なトーンで回答せよ。
   推測は絶対に避けよ。最後に必ず:
   「安全のため、ご注文時に必ず人間のスタッフに直接お伝えください。私たちが責任を持ってシェフに確認します。」
   と人間に最終確認を委ねよ。

3. 売り切れ（ヤマ）へのダブル・セーフティ:
   スペシャルや限定メニューをすすめる際は、品切れの可能性をエンタメとして伝えよ。
   例:「人気すぎて売り切れてたらごめん！先輩に『まだある？』って聞いてみて！もし無くても、別の最高の一皿を提案してくれるよ！」

4. カテゴリー別・提案ロジック:
   - レギュラー: Guuの魂となる定番として自信を持っておすすめ。
   - 共通スペシャル: 今だけの絶対的な看板メニューとして強くプッシュ。
   - 奇跡のコラボ: 担当シェフ名付きメニューで別シェフの日に提供中の場合、「昨日の余り」とは絶対言わず「今日は奇跡が起きてる！奇跡のコラボメニューが食べられるよ！」とプレミアム感を出せ。
   - ドリンク: 食事の流れで自然にアップセル。

5. アナログ誘導ミッション（Guuカルチャー体験）:
   会話の切れ目にランダムに1つ提案し、お客様とスタッフのアイスブレイクを作れ。
   - Oishii: 「料理に感動したら、お皿を下げるスタッフに『オイシイ！』って伝えてみて！」
   - Gochisosama: 「帰る時に『ゴチソウサマ！』って言ってみて。最高の褒め言葉なんだ。」
   - Otsukaresama: 「ビールが来たら、グラスを向けて『オツカレサマ！』って言ってみて！」

== 追加ルール ==
- 言語対応: お客様が使う言語に合わせて返答せよ。日本語なら日本語、英語なら英語。ただしキャラのテンションは維持。
- 料理名は常にメニューデータの英語表記のまま使え。翻訳するな。画面上のメニューカードと一致させるため。
- ハルシネーション禁止: メニューにない料理や価格を捏造するな。不明な点は「先輩に確認するね！」と答えよ。
- 簡潔さ: 2-4文程度。長文は避けつつ、料理の魅力とテンションは十分に伝えよ。
- フォーマット禁止: Markdown記法（**太字**、[リンク](URL)、# 見出し等）は絶対に使うな。プレーンテキストのみ。
- 時間帯メニュー: 魅力・特徴に「Lunch only」とあるメニューはランチタイム（11:30-14:00）のみ。ディナータイムに勧めるな。
- ドリンク・Sweet・スペシャルは終日提供。
- 出勤スタッフへの言及: 出勤中のスタッフの名前とリスペクト要素を自然に会話に織り込み、先輩を立てよ。\
"""


class AIHandler:
    """Wraps Google Gemini 2.5 Flash with John character and dynamic menu/staff context."""

    def __init__(self, menu_context: str = "", staff_context: str = ""):
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set")
        genai.configure(api_key=api_key)
        self._menu_context = menu_context
        self._staff_context = staff_context
        self._build_model()

    def _build_model(self):
        restaurant_name = os.getenv("RESTAURANT_NAME", "Guu Original")
        restaurant_info = os.getenv(
            "RESTAURANT_INFO",
            "Hours and location not yet configured.",
        )

        system_instruction = SYSTEM_TEMPLATE.format(
            restaurant_name=restaurant_name,
            restaurant_info=restaurant_info,
            menu_context=self._menu_context or "メニュー情報はまだ登録されていません。",
            staff_context=self._staff_context or "スタッフ情報はまだ登録されていません。",
        )

        self.model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=system_instruction,
            generation_config=genai.GenerationConfig(
                temperature=0.8,
                max_output_tokens=1500,
            ),
        )
        logger.info("Gemini model built: %d chars menu, %d chars staff.",
                     len(self._menu_context), len(self._staff_context))

    def update_menu_context(self, menu_context: str):
        """Rebuild the model only if menu data has changed."""
        if menu_context != self._menu_context:
            self._menu_context = menu_context
            self._build_model()

    def update_staff_context(self, staff_context: str):
        """Rebuild the model only if staff data has changed."""
        if staff_context != self._staff_context:
            self._staff_context = staff_context
            self._build_model()

    def generate_response(self, user_message: str, history: list[dict] | None = None) -> str:
        """Generate a response with conversation history support."""
        try:
            gemini_history = []
            if history:
                for msg in history[-20:]:
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
                "ごめん、今ちょっと調子悪いみたい...！"
                "先輩スタッフに直接聞いてみて！何でも教えてくれるよ！"
            )
