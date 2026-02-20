"""
SUMI X Orator - Training AI Handler
Simulates a Canadian customer for staff English conversation training.
"""

import os
import json
import logging
from datetime import datetime
from zoneinfo import ZoneInfo

import google.generativeai as genai

logger = logging.getLogger(__name__)

TRAINING_PROMPT = """\
You are a Canadian customer visiting "Guu Original Thurlow" izakaya in Vancouver for the first time.
The user is a Japanese staff member practicing their English service skills.

Your personality:
- Friendly, curious Canadian who loves trying new food
- You ask natural questions about the menu, ingredients, recommendations
- You speak casual but polite Canadian English

== Current Menu ==
{menu_context}

== Rules ==
1. Turn 1-2: Ask questions about the menu, specials, or what to order. Be a natural, realistic customer. Keep feedback_to_staff as empty string "".
2. Turn 3: Decide on your order. Then, switch to your role as a "senior staff mentor" and give constructive feedback in feedback_to_staff (in Japanese) evaluating:
   - Was the staff's English natural and easy to understand?
   - Did they show Guu's signature energy and hospitality?
   - Did they attempt to upsell (drinks, sides, desserts)?
   - Suggest better English phrases they could have used.
3. Always respond in the exact JSON format specified.
4. As a customer, speak in natural Canadian English only.
5. feedback_to_staff must be in Japanese.
6. Keep customer_reply to 1-3 sentences max.\
"""


class TrainingHandler:
    """AI that plays a customer for staff English training."""

    def __init__(self, menu_context: str = ""):
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set")
        genai.configure(api_key=api_key)
        self._menu_context = menu_context
        self._build_model()

    def _build_model(self):
        system_instruction = TRAINING_PROMPT.format(
            menu_context=self._menu_context or "No menu items registered yet.",
        )

        self.model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=system_instruction,
            generation_config=genai.GenerationConfig(
                temperature=0.8,
                max_output_tokens=1000,
                response_mime_type="application/json",
            ),
        )
        logger.info("Training model built.")

    def update_menu_context(self, menu_context: str):
        if menu_context != self._menu_context:
            self._menu_context = menu_context
            self._build_model()

    def generate_response(self, user_message: str, history: list[dict] | None = None) -> dict:
        """Generate a training response as JSON."""
        try:
            gemini_history = []
            if history:
                for msg in history[-20:]:
                    role = "model" if msg["role"] == "assistant" else "user"
                    gemini_history.append({"role": role, "parts": [msg["content"]]})

            turn_count = len(gemini_history) // 2 + 1
            time_hint = f"[Turn {turn_count}] "

            chat = self.model.start_chat(history=gemini_history)
            response = chat.send_message(time_hint + user_message)
            raw = response.text.strip()

            parsed = json.loads(raw)
            return {
                "customer_reply": parsed.get("customer_reply", ""),
                "feedback_to_staff": parsed.get("feedback_to_staff", ""),
            }
        except json.JSONDecodeError:
            logger.exception("Training JSON parse error: %s", raw if 'raw' in dir() else "no response")
            return {
                "customer_reply": "Sorry, could you say that again?",
                "feedback_to_staff": "",
            }
        except Exception:
            logger.exception("Training API error")
            return {
                "customer_reply": "Sorry, I'm having trouble understanding. Could you repeat that?",
                "feedback_to_staff": "",
            }
