"""
SUMI X Orator - Backend API
FastAPI + Gemini 1.5 Flash + Google Sheets

Start command: uvicorn main:app --host 0.0.0.0 --port $PORT
"""

import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from database import MenuDatabase
from ai_handler import AIHandler
from tts_handler import TTSHandler
from training_handler import TrainingHandler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

db: MenuDatabase | None = None
ai: AIHandler | None = None
tts: TTSHandler | None = None
trainer: TrainingHandler | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global db, ai, tts, trainer
    logger.info("Starting SUMI X Orator API ...")
    try:
        db = MenuDatabase()
        logger.info("Google Sheets connected.")
    except Exception:
        logger.exception("Google Sheets init failed")
        db = None
    try:
        ai = AIHandler(
            menu_context=db.get_menu_context() if db else "",
            staff_context=db.get_staff_context() if db else "",
        )
        logger.info("Gemini AI ready.")
    except Exception:
        logger.exception("Gemini init failed")
        ai = None
    try:
        tts = TTSHandler()
        logger.info("Google Cloud TTS ready.")
    except Exception:
        logger.exception("TTS init failed")
        tts = None
    try:
        trainer = TrainingHandler(menu_context=db.get_menu_context() if db else "")
        logger.info("Training AI ready.")
    except Exception:
        logger.exception("Training init failed")
        trainer = None
    logger.info("Startup complete.")
    yield
    logger.info("Shutting down.")


limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="SUMI X Orator API", lifespan=lifespan)
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "ご利用ありがとうございました。しばらくお待ちください。"},
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # MVP: allow all. Restrict in production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------
class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    reply: str
    menu_items: list[dict] = []


class TTSRequest(BaseModel):
    text: str
    lang: str = "ja-JP"


class RatingRequest(BaseModel):
    rating: int  # 1-5
    message_count: int = 0
    lang: str = ""


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.post("/api/chat", response_model=ChatResponse)
@limiter.limit("50/hour")
async def chat(request: Request, req: ChatRequest):
    if not ai:
        raise HTTPException(status_code=503, detail="AI not initialized")

    # Refresh menu & staff if stale (real-time admin sync)
    if db:
        db.refresh_if_stale()
        ai.update_menu_context(db.get_menu_context())
        ai.update_staff_context(db.get_staff_context())

    # Build conversation history
    history = [{"role": msg.role, "content": msg.content} for msg in req.history]

    # Generate response
    reply = ai.generate_response(req.message, history)

    # Find menu items mentioned in the response
    menu_items = db.find_mentioned_items(reply) if db else []

    return ChatResponse(reply=reply, menu_items=menu_items)


@app.post("/api/tts")
@limiter.limit("50/hour")
async def text_to_speech(request: Request, req: TTSRequest):
    if not tts:
        raise HTTPException(status_code=503, detail="TTS not initialized")
    try:
        audio = tts.synthesize(req.text, req.lang)
        return Response(content=audio, media_type="audio/mpeg")
    except Exception:
        logger.exception("TTS synthesis failed")
        raise HTTPException(status_code=500, detail="TTS synthesis failed")


@app.post("/api/chat/train")
@limiter.limit("50/hour")
async def chat_train(request: Request, req: ChatRequest):
    if not trainer:
        raise HTTPException(status_code=503, detail="Training AI not initialized")

    if db:
        db.refresh_if_stale()
        trainer.update_menu_context(db.get_menu_context())

    history = [{"role": msg.role, "content": msg.content} for msg in req.history]
    result = trainer.generate_response(req.message, history)
    return result


@app.post("/api/rating")
@limiter.limit("5/hour")
async def submit_rating(request: Request, req: RatingRequest):
    if not db:
        raise HTTPException(status_code=503, detail="Database not connected")
    if not 1 <= req.rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be 1-5")
    db.save_rating(req.rating, req.message_count, req.lang)
    return {"status": "ok"}


@app.get("/api/menu")
async def get_menu():
    if not db:
        raise HTTPException(status_code=503, detail="Database not connected")
    db.refresh_if_stale()
    return {"items": db.get_active_items()}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/")
async def root():
    return {"app": "SUMI X Orator", "status": "running"}
