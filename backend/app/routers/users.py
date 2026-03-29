from fastapi import APIRouter, HTTPException, Depends

from app.dependencies import db
from app.schemas.user import (
    CreateUserRequest,
    UpdateRoleRequest,
    AssignManagerRequest,
)
from app.services.auth_service import hash_password, generate_random_password
from app.services.email_service import send_generated_password_email
from app.middleware.role_middleware import require_role

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/")
async def list_users(current_user=Depends(require_role("ADMIN"))):
    users = await db.user.find_many(
        where={"companyId": current_user.companyId},
        order={"createdAt": "desc"},
    )
    return [
        {
            "id": u.id,
            "email": u.email,
            "first_name": u.firstName,
            "last_name": u.lastName,
            "role": u.role,
            "is_active": u.isActive,
            "manager_id": u.managerId,
            "created_at": u.createdAt.isoformat(),
        }
        for u in users
    ]


@router.post("/")
async def create_user(
    req: CreateUserRequest,
    current_user=Depends(require_role("ADMIN")),
):
    existing = await db.user.find_unique(where={"email": req.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already in use")

    if req.role not in ("EMPLOYEE", "MANAGER", "ADMIN"):
        raise HTTPException(status_code=400, detail="Invalid role")

    if req.manager_id:
        manager = await db.user.find_unique(where={"id": req.manager_id})
        if not manager or manager.companyId != current_user.companyId:
            raise HTTPException(status_code=400, detail="Invalid manager")

    password = req.password or generate_random_password()

    user = await db.user.create(
        data={
            "email": req.email,
            "passwordHash": hash_password(password),
            "firstName": req.first_name,
            "lastName": req.last_name,
            "role": req.role,
            "companyId": current_user.companyId,
            "managerId": req.manager_id,
        }
    )

    return {
        "id": user.id,
        "email": user.email,
        "first_name": user.firstName,
        "last_name": user.lastName,
        "role": user.role,
        "is_active": user.isActive,
        "manager_id": user.managerId,
    }


@router.get("/{user_id}")
async def get_user(user_id: str, current_user=Depends(require_role("ADMIN"))):
    user = await db.user.find_unique(where={"id": user_id})
    if not user or user.companyId != current_user.companyId:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "email": user.email,
        "first_name": user.firstName,
        "last_name": user.lastName,
        "role": user.role,
        "is_active": user.isActive,
        "manager_id": user.managerId,
        "created_at": user.createdAt.isoformat(),
    }


@router.patch("/{user_id}/role")
async def update_role(
    user_id: str,
    req: UpdateRoleRequest,
    current_user=Depends(require_role("ADMIN")),
):
    user = await db.user.find_unique(where={"id": user_id})
    if not user or user.companyId != current_user.companyId:
        raise HTTPException(status_code=404, detail="User not found")

    if req.role not in ("EMPLOYEE", "MANAGER", "ADMIN"):
        raise HTTPException(status_code=400, detail="Invalid role")

    updated = await db.user.update(
        where={"id": user_id},
        data={"role": req.role},
    )
    return {"id": updated.id, "role": updated.role}


@router.patch("/{user_id}/manager")
async def assign_manager(
    user_id: str,
    req: AssignManagerRequest,
    current_user=Depends(require_role("ADMIN")),
):
    user = await db.user.find_unique(where={"id": user_id})
    if not user or user.companyId != current_user.companyId:
        raise HTTPException(status_code=404, detail="User not found")

    if req.manager_id:
        manager = await db.user.find_unique(where={"id": req.manager_id})
        if not manager or manager.companyId != current_user.companyId:
            raise HTTPException(status_code=400, detail="Invalid manager")
        if manager.id == user_id:
            raise HTTPException(status_code=400, detail="User cannot be their own manager")

    updated = await db.user.update(
        where={"id": user_id},
        data={"managerId": req.manager_id},
    )
    return {"id": updated.id, "manager_id": updated.managerId}


@router.delete("/{user_id}")
async def deactivate_user(
    user_id: str,
    current_user=Depends(require_role("ADMIN")),
):
    user = await db.user.find_unique(where={"id": user_id})
    if not user or user.companyId != current_user.companyId:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")

    await db.user.update(where={"id": user_id}, data={"isActive": False})
    return {"detail": "User deactivated"}


@router.post("/{user_id}/send-password")
async def send_password(
    user_id: str,
    current_user=Depends(require_role("ADMIN")),
):
    user = await db.user.find_unique(where={"id": user_id})
    if not user or user.companyId != current_user.companyId:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.isActive:
        raise HTTPException(status_code=400, detail="Cannot send password to inactive user")

    password = generate_random_password()
    await db.user.update(
        where={"id": user_id},
        data={
            "passwordHash": hash_password(password),
            "mustChangePassword": True,
        },
    )

    try:
        await send_generated_password_email(user.email, password)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Password updated but failed to send email: {str(e)}",
        )

    return {"detail": "Password sent to user's email."}
