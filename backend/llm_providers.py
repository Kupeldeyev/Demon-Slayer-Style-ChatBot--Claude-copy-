"""
A tiny provider-agnostic interface over two LLM chat-completion APIs:
Anthropic's Messages API and Google's Gemini API. Both are called directly
over HTTP with `httpx` (no vendor SDKs) to keep requirements.txt minimal, as
specified in the Technical Task Definition.

Both `anthropic_chat` and `gemini_chat` take the SAME shape of input:
    messages: list[{"role": "user" | "assistant", "text": str}]
        - plain conversational turns, no provider-specific formatting
    system_prompt: str
    tools: list[dict]  — already in that provider's own tool-schema shape
                          (see MCPManager.list_tool_schemas in mcp_client.py)

...and return the SAME shape of output, a `LLMTurn`:
    - {"type": "text", "text": "..."}                                  or
    - {"type": "tool_call", "name": "...", "arguments": {...}, "raw": ...}

`raw` carries whatever provider-specific object main.py needs to correctly
continue the conversation after running the tool (Anthropic needs the
assistant's tool_use block + a tool_use_id; Gemini needs the model's
functionCall content block). main.py's orchestration loop treats it as an
opaque value it only ever hands back to the same provider's `_result`
message builder below.
"""

from __future__ import annotations

import os
from typing import Any, Literal, TypedDict

import httpx

Provider = Literal["anthropic", "gemini"]


class LLMMessage(TypedDict):
    role: Literal["user", "assistant"]
    text: str


class LLMTurn(TypedDict, total=False):
    type: Literal["text", "tool_call"]
    text: str
    name: str
    arguments: dict[str, Any]
    raw: Any


ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")
ANTHROPIC_VERSION = "2023-06-01"

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")


class LLMError(RuntimeError):
    """Raised when a provider's API returns an error response."""


# ---------------------------------------------------------------------------
# Anthropic
# ---------------------------------------------------------------------------


async def anthropic_chat(
    messages: list[LLMMessage],
    system_prompt: str,
    tools: list[dict[str, Any]],
) -> LLMTurn:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise LLMError("ANTHROPIC_API_KEY is not set in the backend's .env file.")

    body = {
        "model": ANTHROPIC_MODEL,
        "max_tokens": 1024,
        "system": system_prompt,
        "messages": [{"role": m["role"], "content": m["text"]} for m in messages],
    }
    if tools:
        body["tools"] = tools

    async with httpx.AsyncClient() as client:
        response = await client.post(
            ANTHROPIC_API_URL,
            headers={
                "x-api-key": api_key,
                "anthropic-version": ANTHROPIC_VERSION,
                "content-type": "application/json",
            },
            json=body,
            timeout=60.0,
        )

    if response.status_code != 200:
        raise LLMError(f"Anthropic API error {response.status_code}: {response.text}")

    data = response.json()
    content_blocks = data.get("content", [])

    tool_use_block = next((b for b in content_blocks if b.get("type") == "tool_use"), None)
    if tool_use_block:
        return {
            "type": "tool_call",
            "name": tool_use_block["name"],
            "arguments": tool_use_block.get("input", {}),
            # The full assistant message + block are needed to build the
            # follow-up request (see anthropic_tool_result_messages below).
            "raw": {"assistant_content": content_blocks, "tool_use_id": tool_use_block["id"]},
        }

    text = "".join(b.get("text", "") for b in content_blocks if b.get("type") == "text")
    return {"type": "text", "text": text or "(empty response)"}


def anthropic_tool_result_messages(raw: dict[str, Any], tool_result_text: str) -> list[dict[str, Any]]:
    """Build the two extra "messages" (in Anthropic's own content-block
    format, not the simplified `LLMMessage` shape) needed to hand a tool's
    result back to Claude: the assistant turn that requested the tool,
    followed by a user turn carrying the tool_result block.
    """
    return [
        {"role": "assistant", "content": raw["assistant_content"]},
        {
            "role": "user",
            "content": [
                {
                    "type": "tool_result",
                    "tool_use_id": raw["tool_use_id"],
                    "content": tool_result_text,
                }
            ],
        },
    ]


async def anthropic_follow_up(
    messages: list[LLMMessage],
    system_prompt: str,
    extra_messages: list[dict[str, Any]],
) -> str:
    """Send the conversation again, this time including the raw tool-result
    messages built above, and return the final plain-text reply.
    """
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise LLMError("ANTHROPIC_API_KEY is not set in the backend's .env file.")

    body = {
        "model": ANTHROPIC_MODEL,
        "max_tokens": 1024,
        "system": system_prompt,
        "messages": [{"role": m["role"], "content": m["text"]} for m in messages] + extra_messages,
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            ANTHROPIC_API_URL,
            headers={
                "x-api-key": api_key,
                "anthropic-version": ANTHROPIC_VERSION,
                "content-type": "application/json",
            },
            json=body,
            timeout=60.0,
        )

    if response.status_code != 200:
        raise LLMError(f"Anthropic API error {response.status_code}: {response.text}")

    data = response.json()
    content_blocks = data.get("content", [])
    text = "".join(b.get("text", "") for b in content_blocks if b.get("type") == "text")
    return text or "(empty response)"


# ---------------------------------------------------------------------------
# Gemini
# ---------------------------------------------------------------------------


def _to_gemini_contents(messages: list[LLMMessage]) -> list[dict[str, Any]]:
    # Gemini calls the assistant role "model" instead of "assistant".
    return [
        {"role": "model" if m["role"] == "assistant" else "user", "parts": [{"text": m["text"]}]}
        for m in messages
    ]


async def gemini_chat(
    messages: list[LLMMessage],
    system_prompt: str,
    tools: list[dict[str, Any]],
) -> LLMTurn:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise LLMError("GEMINI_API_KEY is not set in the backend's .env file.")

    body: dict[str, Any] = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": _to_gemini_contents(messages),
    }
    if tools:
        body["tools"] = [{"function_declarations": tools}]

    url = GEMINI_API_URL.format(model=GEMINI_MODEL)

    async with httpx.AsyncClient() as client:
        response = await client.post(
            url,
            headers={"x-goog-api-key": api_key, "content-type": "application/json"},
            json=body,
            timeout=60.0,
        )

    if response.status_code != 200:
        raise LLMError(f"Gemini API error {response.status_code}: {response.text}")

    data = response.json()
    candidate = (data.get("candidates") or [{}])[0]
    parts = candidate.get("content", {}).get("parts", [])

    function_call = next((p["functionCall"] for p in parts if "functionCall" in p), None)
    if function_call:
        return {
            "type": "tool_call",
            "name": function_call["name"],
            "arguments": function_call.get("args", {}),
            # Gemini needs the exact "model" content block echoed back
            # verbatim in the follow-up request.
            "raw": {"model_content": candidate.get("content", {}), "name": function_call["name"]},
        }

    text = "".join(p.get("text", "") for p in parts if "text" in p)
    return {"type": "text", "text": text or "(empty response)"}


async def gemini_follow_up(
    messages: list[LLMMessage],
    system_prompt: str,
    raw: dict[str, Any],
    tool_result_text: str,
) -> str:
    """Send the conversation again with the model's function call and our
    function's result appended, and return the final plain-text reply.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise LLMError("GEMINI_API_KEY is not set in the backend's .env file.")

    contents = _to_gemini_contents(messages)
    contents.append(raw["model_content"])
    contents.append(
        {
            "role": "user",
            "parts": [
                {
                    "functionResponse": {
                        "name": raw["name"],
                        "response": {"result": tool_result_text},
                    }
                }
            ],
        }
    )

    body = {"system_instruction": {"parts": [{"text": system_prompt}]}, "contents": contents}
    url = GEMINI_API_URL.format(model=GEMINI_MODEL)

    async with httpx.AsyncClient() as client:
        response = await client.post(
            url,
            headers={"x-goog-api-key": api_key, "content-type": "application/json"},
            json=body,
            timeout=60.0,
        )

    if response.status_code != 200:
        raise LLMError(f"Gemini API error {response.status_code}: {response.text}")

    data = response.json()
    candidate = (data.get("candidates") or [{}])[0]
    parts = candidate.get("content", {}).get("parts", [])
    text = "".join(p.get("text", "") for p in parts if "text" in p)
    return text or "(empty response)"
