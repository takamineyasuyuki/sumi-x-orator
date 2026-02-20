"""
SUMI X Orator - Backend API
FastAPI + Gemini 1.5 Flash + Google Sheets

Start command: uvicorn main:app --host 0.0.0.0 --port $PORT
"""

import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import MenuDatabase
from ai_handler import AIHandler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

db: MenuDatabase | None = None
ai: AIHandler | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global db, ai
    logger.info("Starting SUMI X Orator API ...")
    try:
        db = MenuDatabase()
        logger.info("Google Sheets connected.")
    except Exception:
        logger.exception("Google Sheets init failed")
        db = None
    try:
        ai = AIHandler(menu_context=db.get_menu_context() if db else "")
        logger.info("Gemini AI ready.")
    except Exception:
        logger.exception("Gemini init failed")
        ai = None
    logger.info("Startup complete.")
    yield
    logger.info("Shutting down.")


app = FastAPI(title="SUMI X Orator API", lifespan=lifespan)

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


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if not ai:
        raise HTTPException(status_code=503, detail="AI not initialized")

    # Refresh menu if stale (real-time admin sync)
    if db:
        db.refresh_if_stale()
        ai.update_menu_context(db.get_menu_context())

    # Build conversation history
    history = [{"role": msg.role, "content": msg.content} for msg in req.history]

    # Generate response
    reply = ai.generate_response(req.message, history)

    # Find menu items mentioned in the response
    menu_items = db.find_mentioned_items(reply) if db else []

    return ChatResponse(reply=reply, menu_items=menu_items)


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
