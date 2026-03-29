from pydantic import BaseModel, EmailStr


class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str | None = None
    first_name: str
    last_name: str
    role: str = "EMPLOYEE"
    manager_id: str | None = None


class UpdateRoleRequest(BaseModel):
    role: str


class AssignManagerRequest(BaseModel):
    manager_id: str | None = None


class UserListResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    is_active: bool
    manager_id: str | None = None
    created_at: str

    model_config = {"from_attributes": True}
