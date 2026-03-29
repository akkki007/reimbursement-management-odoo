from fastapi import APIRouter, HTTPException, status, Depends

from app.dependencies import db
from app.schemas.auth import (
    SignupRequest,
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    MeResponse,
    UserResponse,
)
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.services.currency_service import (
    resolve_currency_for_country,
    get_countries_with_currencies,
)
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.get("/countries")
async def list_countries():
    """Public endpoint: list countries with currencies for signup dropdown."""
    return await get_countries_with_currencies()


@router.post("/signup", response_model=TokenResponse)
async def signup(req: SignupRequest):
    existing = await db.user.find_unique(where={"email": req.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    currency = await resolve_currency_for_country(req.country)

    company = await db.company.create(
        data={
            "name": req.company_name,
            "country": req.country,
            "defaultCurrency": currency,
        }
    )

    user = await db.user.create(
        data={
            "email": req.email,
            "passwordHash": hash_password(req.password),
            "firstName": req.first_name,
            "lastName": req.last_name,
            "role": "ADMIN",
            "companyId": company.id,
        }
    )

    return TokenResponse(
        access_token=create_access_token(user.id, user.role, company.id),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    user = await db.user.find_unique(where={"email": req.email})
    if not user or not verify_password(req.password, user.passwordHash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.isActive:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    return TokenResponse(
        access_token=create_access_token(user.id, user.role, user.companyId),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(req: RefreshRequest):
    payload = decode_token(req.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = await db.user.find_unique(where={"id": payload["sub"]})
    if not user or not user.isActive:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    return TokenResponse(
        access_token=create_access_token(user.id, user.role, user.companyId),
        refresh_token=create_refresh_token(user.id),
    )


@router.get("/me", response_model=MeResponse)
async def get_me(current_user=Depends(get_current_user)):
    company = await db.company.find_unique(where={"id": current_user.companyId})

    return MeResponse(
        user=UserResponse(
            id=current_user.id,
            email=current_user.email,
            first_name=current_user.firstName,
            last_name=current_user.lastName,
            role=current_user.role,
            is_active=current_user.isActive,
            company_id=current_user.companyId,
            manager_id=current_user.managerId,
        ),
        company={
            "id": company.id,
            "name": company.name,
            "country": company.country,
            "default_currency": company.defaultCurrency,
        },
    )
