"""
FastAPI backend for Kimetsu Claude.

Wires together:
  - MCPManager (mcp_client.py)   — talks to the local weather.py MCP server
  - llm_providers.py             — talks to Anthropic or Gemini's chat API
  - POST /api/chat                — the one endpoint the React frontend calls

Run it with:
    uvicorn main:app --reload --port 8000

See README.md in this folder for the full setup steps (.env, etc).
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from llm_providers import (
    LLMError,
    anthropic_chat,
    anthropic_follow_up,
    anthropic_tool_result_messages,
    gemini_chat,
    gemini_follow_up,
)
from mcp_client import MCPManager

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

# Which LLM provider actually answers requests. This is a server-side
# setting (not controlled by the frontend's cosmetic model picker) — set
# it in backend/.env. Defaults to Gemini since that's what the frontend's
# offline reference implementation was already using.
LLM_PROVIDER: Literal["anthropic", "gemini"] = os.getenv("LLM_PROVIDER", "gemini")  # type: ignore[assignment]

SYSTEM_PROMPT = (
    "You are Kimetsu Claude, a warm, upbeat anime-styled assistant with a "
    "Demon Slayer aesthetic. Keep replies concise and conversational. "
    "You have access to a get_forecast and a get_alerts tool for real US "
    "weather data — use them whenever the user asks about weather, "
    "temperature, or conditions in a specific place, instead of guessing."
)

FRONTEND_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


# ---------------------------------------------------------------------------
# Pydantic schema (Task 3, step 4)
# ---------------------------------------------------------------------------


class Message(BaseModel):
    role: Literal["user", "assistant"]
    text: str


class ChatRequest(BaseModel):
    message: str
    model: str = Field(default="sakura-sonnet", description="Cosmetic model id from the frontend's picker.")
    history: list[Message] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str


# ---------------------------------------------------------------------------
# App + lifespan (Task 3, step 3): start/stop the MCP server subprocess
# alongside the FastAPI app itself.
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    weather_script = os.path.join(os.path.dirname(__file__), "weather.py")
    mcp_manager = MCPManager(server_script=weather_script)

    try:
        await mcp_manager.connect()
    except Exception:
        # Don't crash the whole API if the weather server can't start —
        # log it and keep going with zero tools available, so plain
        # conversation still works.
        logger.exception("Failed to start the weather MCP server; continuing without tools.")

    app.state.mcp_manager = mcp_manager
    try:
        yield
    finally:
        await mcp_manager.close()


app = FastAPI(title="Kimetsu Claude Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    """Small endpoint to confirm the server + MCP connection are alive."""
    manager: MCPManager = app.state.mcp_manager
    return {
        "status": "ok",
        "provider": LLM_PROVIDER,
        "mcp_connected": manager.session is not None,
        "tools": [tool.name for tool in manager.tools],
    }


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """Task 4: the LLM orchestration loop.

    1. Build the conversation from `history` + the new `message`.
    2. Ask the configured LLM provider for a reply, offering it the MCP
       tool schemas.
    3. If it replies with plain text, return that directly.
    4. If it replies with a tool call instead, run the tool via MCPManager,
       feed the result back to the LLM, and return ITS follow-up reply.
    """
    manager: MCPManager = app.state.mcp_manager
    messages = [{"role": m.role, "text": m.text} for m in request.history] + [
        {"role": "user", "text": request.message}
    ]

    tools = manager.list_tool_schemas(LLM_PROVIDER) if manager.session else []

    try:
        if LLM_PROVIDER == "anthropic":
            reply = await _run_anthropic(messages, tools, manager)
        elif LLM_PROVIDER == "gemini":
            reply = await _run_gemini(messages, tools, manager)
        else:
            raise HTTPException(status_code=500, detail=f"Unknown LLM_PROVIDER: {LLM_PROVIDER!r}")
    except LLMError as error:
        # A configuration or upstream-API problem (bad/missing key, rate
        # limit, etc) — surface it as a normal chat reply instead of a
        # raw 500, so the frontend shows something readable.
        logger.warning("LLM provider error: %s", error)
        return ChatResponse(reply=f"I couldn't reach my brain just now ({error}).")

    return ChatResponse(reply=reply)


async def _run_anthropic(messages, tools, manager: MCPManager) -> str:
    turn = await anthropic_chat(messages, SYSTEM_PROMPT, tools)

    if turn["type"] == "text":
        return turn["text"]

    # turn["type"] == "tool_call"
    tool_result_text = await manager.execute_tool(turn["name"], turn["arguments"])
    extra_messages = anthropic_tool_result_messages(turn["raw"], tool_result_text)
    return await anthropic_follow_up(messages, SYSTEM_PROMPT, extra_messages)


async def _run_gemini(messages, tools, manager: MCPManager) -> str:
    turn = await gemini_chat(messages, SYSTEM_PROMPT, tools)

    if turn["type"] == "text":
        return turn["text"]

    # turn["type"] == "tool_call"
    tool_result_text = await manager.execute_tool(turn["name"], turn["arguments"])
    return await gemini_follow_up(messages, SYSTEM_PROMPT, turn["raw"], tool_result_text)
