"""
A local MCP (Model Context Protocol) server that exposes weather tools.

This is the "weather.py" referenced in the Technical Task Definition. It is
launched as a *subprocess* by mcp_client.py (over stdio, not HTTP) — you
never run this file directly against a browser or curl. Think of it as a
tiny, self-contained plugin that hands the LLM two tools:

  - get_forecast(latitude, longitude)  -> multi-period forecast for a point
  - get_alerts(state)                  -> active weather alerts for a US state

Data source: the US National Weather Service API (api.weather.gov). It's
free, requires no API key, and only covers the United States — good enough
for a demo/reference implementation. Swap `make_nws_request` for a
different provider (OpenWeatherMap, etc.) if you need global coverage.

Run standalone for a quick manual smoke test:
    python weather.py
(it will just sit there speaking MCP over stdio — that's expected; Ctrl+C
to exit. It's meant to be launched BY mcp_client.py, not used interactively.)
"""

from typing import Any

import httpx
from mcp.server.fastmcp import FastMCP

# The MCP server "name" — this shows up in tool listings/logs on the client side.
mcp = FastMCP("weather")

NWS_API_BASE = "https://api.weather.gov"
USER_AGENT = "sakura-claude-weather/1.0 (contact: dev@example.com)"


async def make_nws_request(url: str) -> dict[str, Any] | None:
    """Make a GET request to the NWS API with proper headers and error handling.

    Returns the parsed JSON body, or None if the request failed for any
    reason (network error, non-2xx status, bad JSON, etc). Tools below
    check for None and return a friendly message instead of crashing.
    """
    headers = {"User-Agent": USER_AGENT, "Accept": "application/geo+json"}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=30.0)
            response.raise_for_status()
            return response.json()
        except (httpx.HTTPError, ValueError):
            return None


def format_alert(feature: dict[str, Any]) -> str:
    """Turn one NWS alert 'feature' object into a short readable block."""
    props = feature.get("properties", {})
    return (
        f"Event: {props.get('event', 'Unknown')}\n"
        f"Area: {props.get('areaDesc', 'Unknown')}\n"
        f"Severity: {props.get('severity', 'Unknown')}\n"
        f"Description: {props.get('description', 'No description available')}\n"
        f"Instructions: {props.get('instruction', 'No specific instructions provided')}"
    )


@mcp.tool()
async def get_alerts(state: str) -> str:
    """Get active weather alerts for a US state.

    Args:
        state: Two-letter US state code (e.g. CA, NY)
    """
    url = f"{NWS_API_BASE}/alerts/active/area/{state.upper()}"
    data = await make_nws_request(url)

    if not data or "features" not in data:
        return "Unable to fetch alerts or no alerts found."

    if len(data["features"]) == 0:
        return "No active alerts for this state."

    alerts = [format_alert(feature) for feature in data["features"]]
    return "\n---\n".join(alerts)


@mcp.tool()
async def get_forecast(latitude: float, longitude: float) -> str:
    """Get the weather forecast for a location.

    Args:
        latitude: Latitude of the location
        longitude: Longitude of the location
    """
    # Step 1: NWS requires looking up the local "grid point" for a lat/lon
    # before you can ask for its forecast.
    points_url = f"{NWS_API_BASE}/points/{latitude},{longitude}"
    points_data = await make_nws_request(points_url)

    if not points_data:
        return "Unable to fetch forecast data for this location (it may be outside the US)."

    forecast_url = points_data["properties"]["forecast"]
    forecast_data = await make_nws_request(forecast_url)

    if not forecast_data:
        return "Unable to fetch detailed forecast."

    # Only show the next few periods so the reply stays short and readable.
    periods = forecast_data["properties"]["periods"]
    forecasts = []
    for period in periods[:5]:
        forecast_text = (
            f"{period['name']}:\n"
            f"Temperature: {period['temperature']}°{period['temperatureUnit']}\n"
            f"Wind: {period['windSpeed']} {period['windDirection']}\n"
            f"Forecast: {period['detailedForecast']}"
        )
        forecasts.append(forecast_text)

    return "\n---\n".join(forecasts)


if __name__ == "__main__":
    # `stdio` transport: the server reads MCP requests from stdin and writes
    # responses to stdout. That's exactly what mcp_client.py's stdio_client
    # connects to when it spawns this script as a subprocess.
    mcp.run(transport="stdio")
