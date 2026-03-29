from pydantic import BaseModel, EmailStr


class SignupRequest(BaseModel):
    company_name: str
    country: str
    email: EmailStr
    password: str
    first_name: str
    last_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    is_active: bool
    must_change_password: bool = False
    company_id: str
    manager_id: str | None = None

    model_config = {"from_attributes": True}


class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str


class SetPasswordRequest(BaseModel):
    new_password: str


class MeResponse(BaseModel):
    user: UserResponse
    company: dict
