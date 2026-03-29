import httpx

_country_cache: list[dict] | None = None


async def get_countries_with_currencies() -> list[dict]:
    """Fetch all countries with their currencies from restcountries API. Cached in-memory."""
    global _country_cache
    if _country_cache is not None:
        return _country_cache

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            "https://restcountries.com/v3.1/all?fields=name,currencies"
        )
        resp.raise_for_status()
        data = resp.json()

    results = []
    for country in data:
        name = country.get("name", {}).get("common", "")
        currencies = country.get("currencies", {})
        if name and currencies:
            currency_code = next(iter(currencies.keys()), None)
            if currency_code:
                results.append({"name": name, "currency": currency_code})

    results.sort(key=lambda c: c["name"])
    _country_cache = results
    return results


async def resolve_currency_for_country(country_name: str) -> str:
    """Given a country name, return its currency code."""
    countries = await get_countries_with_currencies()
    for c in countries:
        if c["name"].lower() == country_name.lower():
            return c["currency"]
    return "USD"


async def get_exchange_rate(from_currency: str, to_currency: str) -> float:
    """Get exchange rate from one currency to another."""
    if from_currency == to_currency:
        return 1.0

    # Validate currency codes are 3-letter alphabetic
    if not from_currency or not from_currency.isalpha() or len(from_currency) != 3:
        raise ValueError(f"Invalid currency code: {from_currency}")
    if not to_currency or not to_currency.isalpha() or len(to_currency) != 3:
        raise ValueError(f"Invalid currency code: {to_currency}")

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"https://api.exchangerate-api.com/v4/latest/{from_currency.upper()}"
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError:
        raise ValueError(f"Could not fetch exchange rate for {from_currency}")

    rates = data.get("rates", {})
    rate = rates.get(to_currency.upper())
    if rate is None:
        raise ValueError(f"Exchange rate not found for {from_currency} -> {to_currency}")
    return float(rate)
