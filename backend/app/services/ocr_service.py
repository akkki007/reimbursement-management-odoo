import httpx
from fastapi import UploadFile

from app.config import get_settings

# Mindee category → our ExpenseCategory mapping
CATEGORY_MAP = {
    "food": "MEALS",
    "meal": "MEALS",
    "restaurant": "MEALS",
    "transport": "TRANSPORT",
    "taxi": "TRANSPORT",
    "fuel": "TRANSPORT",
    "gas": "TRANSPORT",
    "parking": "TRANSPORT",
    "hotel": "ACCOMMODATION",
    "lodging": "ACCOMMODATION",
    "accommodation": "ACCOMMODATION",
    "office": "OFFICE_SUPPLIES",
    "supplies": "OFFICE_SUPPLIES",
    "stationery": "OFFICE_SUPPLIES",
    "entertainment": "ENTERTAINMENT",
    "software": "SOFTWARE",
    "subscription": "SOFTWARE",
    "travel": "TRAVEL",
    "flight": "TRAVEL",
    "airline": "TRAVEL",
}


def _map_category(raw_category: str | None) -> str:
    if not raw_category:
        return "OTHER"
    lower = raw_category.lower()
    for keyword, mapped in CATEGORY_MAP.items():
        if keyword in lower:
            return mapped
    return "OTHER"


async def parse_receipt(file: UploadFile) -> dict:
    """
    Send receipt image to Mindee Receipt API v5 and return structured data.
    Falls back gracefully if the API key is not configured.
    """
    settings = get_settings()

    if not settings.mindee_api_key or settings.mindee_api_key == "your-mindee-api-key":
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
            "error": "Mindee API key not configured",
        }

    content = await file.read()

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.mindee.net/v1/products/mindee/expense_receipts/v5/predict",
            headers={"Authorization": f"Token {settings.mindee_api_key}"},
            files={"document": (file.filename, content, file.content_type)},
        )

    if resp.status_code != 201:
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
            "error": f"Mindee API error: {resp.status_code}",
        }

    data = resp.json()
    prediction = data.get("document", {}).get("inference", {}).get("prediction", {})

    amount = prediction.get("total_amount", {}).get("value")
    currency = prediction.get("locale", {}).get("currency")
    date_val = prediction.get("date", {}).get("value")
    vendor = prediction.get("supplier_name", {}).get("value")
    raw_category = prediction.get("category", {}).get("value")

    line_items = []
    for item in prediction.get("line_items", []):
        line_items.append({
            "description": item.get("description", ""),
            "amount": item.get("total_amount"),
        })

    description_parts = [li["description"] for li in line_items if li["description"]]
    description = "; ".join(description_parts) if description_parts else (vendor or "")

    confidence_val = prediction.get("total_amount", {}).get("confidence", 0)

    return {
        "amount": amount,
        "currency": currency,
        "date": date_val,
        "vendor_name": vendor,
        "category": _map_category(raw_category),
        "description": description,
        "line_items": line_items,
        "raw_text": str(prediction.get("raw_text", "")),
        "confidence": confidence_val,
        "raw_data": prediction,
    }
