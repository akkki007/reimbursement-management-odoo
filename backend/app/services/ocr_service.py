import base64
import json
import re

import httpx
from fastapi import UploadFile

from app.config import get_settings

CURRENCY_SYMBOL_MAP = {
    "$": "USD",
    "€": "EUR",
    "£": "GBP",
    "¥": "JPY",
    "₹": "INR",
    "₩": "KRW",
    "₽": "RUB",
    "₺": "TRY",
    "₴": "UAH",
    "₿": "BTC",
    "R$": "BRL",
    "C$": "CAD",
    "A$": "AUD",
    "NZ$": "NZD",
    "HK$": "HKD",
    "S$": "SGD",
    "₱": "PHP",
    "₫": "VND",
    "฿": "THB",
    "RM": "MYR",
    "kr": "SEK",
    "zł": "PLN",
    "Kč": "CZK",
    "CHF": "CHF",
    "AED": "AED",
    "SAR": "SAR",
    "ZAR": "ZAR",
}


def _normalize_currency(raw_currency: str | None) -> str | None:
    """Convert currency symbols or common shorthand to 3-letter ISO codes."""
    if not raw_currency:
        return None
    stripped = raw_currency.strip()
    # Already a valid 3-letter code
    if len(stripped) == 3 and stripped.isalpha():
        return stripped.upper()
    # Check symbol map
    if stripped in CURRENCY_SYMBOL_MAP:
        return CURRENCY_SYMBOL_MAP[stripped]
    # Try uppercase match (e.g. "usd" -> "USD")
    if len(stripped) == 3 and stripped.upper().isalpha():
        return stripped.upper()
    return None


CATEGORY_MAP = {
    "food": "MEALS",
    "meal": "MEALS",
    "restaurant": "MEALS",
    "cafe": "MEALS",
    "coffee": "MEALS",
    "lunch": "MEALS",
    "dinner": "MEALS",
    "breakfast": "MEALS",
    "transport": "TRANSPORT",
    "taxi": "TRANSPORT",
    "uber": "TRANSPORT",
    "fuel": "TRANSPORT",
    "gas": "TRANSPORT",
    "parking": "TRANSPORT",
    "hotel": "ACCOMMODATION",
    "lodging": "ACCOMMODATION",
    "accommodation": "ACCOMMODATION",
    "airbnb": "ACCOMMODATION",
    "office": "OFFICE_SUPPLIES",
    "supplies": "OFFICE_SUPPLIES",
    "stationery": "OFFICE_SUPPLIES",
    "entertainment": "ENTERTAINMENT",
    "software": "SOFTWARE",
    "subscription": "SOFTWARE",
    "license": "SOFTWARE",
    "travel": "TRAVEL",
    "flight": "TRAVEL",
    "airline": "TRAVEL",
    "train": "TRAVEL",
}


def _map_category(raw_category: str | None) -> str:
    if not raw_category:
        return "OTHER"
    lower = raw_category.lower()
    for keyword, mapped in CATEGORY_MAP.items():
        if keyword in lower:
            return mapped
    return "OTHER"


def _extract_json(text: str) -> dict | None:
    """Try to extract a JSON object from model output."""
    # Try to find JSON block in markdown code fence
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    # Try to find raw JSON object
    match = re.search(r"\{[^{}]*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    return None


async def parse_receipt(file: UploadFile) -> dict:
    """
    Send receipt image to local Ollama glm-ocr model for OCR extraction.
    Returns structured expense data parsed from the receipt.
    """
    content = await file.read()
    settings = get_settings()
    b64_image = base64.b64encode(content).decode("utf-8")

    prompt = """Analyze this receipt image and extract the following information.
Return ONLY a JSON object with these exact keys (no extra text):
{
  "amount": <total amount as a number>,
  "currency": "<3-letter currency code like USD, EUR, INR>",
  "date": "<date in YYYY-MM-DD format>",
  "vendor_name": "<store/vendor name>",
  "category": "<one of: food, transport, hotel, office, software, entertainment, travel, other>",
  "description": "<brief description of items purchased>",
  "line_items": [{"description": "<item>", "amount": <price>}]
}

If you cannot determine a field, use null for that value."""

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                f"{settings.ollama_url}/api/chat",
                json={
                    "model": settings.ocr_model,
                    "messages": [
                        {
                            "role": "user",
                            "content": prompt,
                            "images": [b64_image],
                        }
                    ],
                    "stream": False,
                    "options": {"temperature": 0.1},
                },
            )

        if resp.status_code != 200:
            return _error_response(f"Ollama error: {resp.status_code}")

        data = resp.json()
        raw_text = data.get("message", {}).get("content", "")

        parsed = _extract_json(raw_text)
        if not parsed:
            # Model returned text but not valid JSON — try to use raw text
            return {
                "amount": None,
                "currency": None,
                "date": None,
                "vendor_name": None,
                "category": "OTHER",
                "description": raw_text[:200],
                "line_items": [],
                "raw_text": raw_text,
                "confidence": 0.5,
            }

        line_items = parsed.get("line_items") or []
        if not isinstance(line_items, list):
            line_items = []

        description = parsed.get("description") or ""
        if not description and line_items:
            description = "; ".join(
                li.get("description", "") for li in line_items if li.get("description")
            )
        if not description:
            description = parsed.get("vendor_name") or ""

        return {
            "amount": parsed.get("amount"),
            "currency": _normalize_currency(parsed.get("currency")),
            "date": parsed.get("date"),
            "vendor_name": parsed.get("vendor_name"),
            "category": _map_category(parsed.get("category")),
            "description": description,
            "line_items": line_items,
            "raw_text": raw_text,
            "confidence": 0.85,
        }

    except httpx.ConnectError:
        return _error_response("Ollama is not running. Start it with: ollama serve")
    except httpx.ReadTimeout:
        return _error_response("OCR timed out — the image may be too large")
    except Exception as e:
        return _error_response(f"OCR failed: {str(e)}")


def _error_response(error_msg: str) -> dict:
    return {
        "amount": None,
        "currency": None,
        "date": None,
        "vendor_name": None,
        "category": "OTHER",
        "description": "",
        "line_items": [],
        "raw_text": "",
        "confidence": 0,
        "error": error_msg,
    }
