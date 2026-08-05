# Kimetsu Claude — Backend

A small FastAPI server that sits between the React frontend and an LLM
provider (Anthropic or Gemini), and gives that LLM a real tool to call: a
local weather MCP server (`weather.py`), connected over stdio.

```
React frontend  ──HTTP──▶  FastAPI (main.py)  ──HTTP──▶  Anthropic / Gemini
   (port 5173)              (port 8000)                     chat API
                                  │
                                  │ stdio (subprocess)
                                  ▼
                         weather.py (MCP server)  ──HTTP──▶  api.weather.gov
```

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# then open .env and set LLM_PROVIDER (anthropic or gemini) + that
# provider's API key

uvicorn main:app --reload --port 8000
```

Leave that running, then start the frontend as usual (`npm run dev` in the
project root) — it already points at `http://localhost:8000` by default
(see `src/data/sampleChats.js` / the root `.env.example`).

Check it's alive any time with:
```bash
curl http://localhost:8000/api/health
```
which reports the active provider and which MCP tools are connected.

## Files

| File | Purpose |
| --- | --- |
| `main.py` | FastAPI app: CORS, lifespan (starts/stops the MCP subprocess), the `POST /api/chat` endpoint and its tool-use orchestration loop. |
| `mcp_client.py` | `MCPManager` — owns the weather MCP server subprocess + session, and maps its tool schemas into Anthropic's or Gemini's tool format. |
| `llm_providers.py` | Provider-agnostic chat functions (`anthropic_chat`, `gemini_chat`) built directly on `httpx`, no vendor SDKs. |
| `weather.py` | The actual MCP server — exposes `get_forecast(lat, lon)` and `get_alerts(state)` tools backed by the free NWS API (`api.weather.gov`, US-only, no key needed). |

## How a weather question flows through the system

1. Frontend `POST`s `{ message, model, history }` to `/api/chat`.
2. `main.py` asks `MCPManager` for the current tool schemas (already
   translated into whichever provider is configured) and sends the
   conversation + those schemas to the LLM.
3. If the LLM's reply is plain text, it's returned immediately.
4. If the LLM instead asks to call a tool (e.g. `get_forecast`), `main.py`:
   - runs it via `MCPManager.execute_tool(name, arguments)`, which forwards
     the call over stdio to `weather.py` and gets back a text result,
   - sends that result back to the LLM as a "tool result" turn,
   - and returns the LLM's final, natural-language follow-up reply.
5. Ordinary (non-weather) questions never trigger step 4 — the LLM decides
   on its own whether a tool is needed, same as normal tool-use.

## Adding a different MCP tool server

`MCPManager` doesn't know anything weather-specific — swap the
`server_script` path passed to it in `main.py`'s `lifespan()` for any other
MCP server script and its tools show up automatically, as long as that
script also speaks MCP over stdio (e.g. built with `mcp.server.fastmcp.FastMCP`,
same as `weather.py`).

## Notes

- `LLM_PROVIDER` is a **server-side** setting — the frontend's model picker
  is currently cosmetic and doesn't change which provider answers.
- If the MCP server fails to start, the API logs it and keeps running with
  zero tools available rather than crashing — plain conversation still works.
- `get_forecast` only covers US locations (a limitation of the free NWS
  API); swap `weather.py`'s `make_nws_request` calls for a different
  provider if you need global coverage.
