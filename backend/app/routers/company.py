from fastapi import APIRouter, HTTPException, Depends

from app.dependencies import db
from app.schemas.company import UpdateCompanyRequest
from app.middleware.auth_middleware import get_current_user
from app.middleware.role_middleware import require_role
from app.services.currency_service import get_countries_with_currencies

router = APIRouter(prefix="/api/company", tags=["Company"])


@router.get("/")
async def get_company(current_user=Depends(get_current_user)):
    company = await db.company.find_unique(where={"id": current_user.companyId})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return {
        "id": company.id,
        "name": company.name,
        "country": company.country,
        "default_currency": company.defaultCurrency,
    }


@router.patch("/")
async def update_company(
    req: UpdateCompanyRequest,
    current_user=Depends(require_role("ADMIN")),
):
    update_data = {}
    if req.name is not None:
        update_data["name"] = req.name
    if req.default_currency is not None:
        update_data["defaultCurrency"] = req.default_currency

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    company = await db.company.update(
        where={"id": current_user.companyId},
        data=update_data,
    )
    return {
        "id": company.id,
        "name": company.name,
        "country": company.country,
        "default_currency": company.defaultCurrency,
    }


@router.get("/currencies")
async def list_currencies(current_user=Depends(require_role("ADMIN"))):
    return await get_countries_with_currencies()
