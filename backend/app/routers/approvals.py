from fastapi import APIRouter, HTTPException, Depends

from app.dependencies import db
from app.schemas.approval import ApproveRequest, RejectRequest, OverrideRequest
from app.middleware.auth_middleware import get_current_user
from app.middleware.role_middleware import require_role
from app.services.approval_service import approve_expense, reject_expense, override_expense
from app.services.expense_service import serialize_expense

router = APIRouter(prefix="/api/approvals", tags=["Approvals"])


@router.get("/pending")
async def get_pending_approvals(
    current_user=Depends(require_role("MANAGER", "ADMIN")),
):
    """List expenses that have an AWAITING step assigned to the current user."""
    awaiting_steps = await db.approvalstep.find_many(
        where={
            "approverId": current_user.id,
            "status": "AWAITING",
        },
        include={
            "expense": {
                "include": {"submittedBy": True}
            }
        },
    )

    results = []
    for step in awaiting_steps:
        e = step.expense
        if e.companyId != current_user.companyId:
            continue
        data = serialize_expense(e)
        data["submitted_by_name"] = f"{e.submittedBy.firstName} {e.submittedBy.lastName}"
        data["current_step_label"] = step.stepLabel
        data["current_step_order"] = step.stepOrder
        results.append(data)

    return results


@router.post("/{expense_id}/approve")
async def approve(
    expense_id: str,
    req: ApproveRequest,
    current_user=Depends(require_role("MANAGER", "ADMIN")),
):
    expense = await approve_expense(expense_id, current_user.id, req.comment)
    return serialize_expense(expense)


@router.post("/{expense_id}/reject")
async def reject(
    expense_id: str,
    req: RejectRequest,
    current_user=Depends(require_role("MANAGER", "ADMIN")),
):
    expense = await reject_expense(expense_id, current_user.id, req.comment)
    return serialize_expense(expense)


@router.get("/{expense_id}/history")
async def get_approval_history(
    expense_id: str,
    current_user=Depends(require_role("MANAGER", "ADMIN")),
):
    actions = await db.approvalaction.find_many(
        where={"expenseId": expense_id},
        include={"actor": True},
        order={"createdAt": "asc"},
    )

    if not actions:
        expense = await db.expense.find_unique(where={"id": expense_id})
        if not expense or expense.companyId != current_user.companyId:
            raise HTTPException(status_code=404, detail="Expense not found")

    return [
        {
            "id": a.id,
            "action": a.action,
            "comment": a.comment,
            "actor_id": a.actorId,
            "actor_name": f"{a.actor.firstName} {a.actor.lastName}",
            "created_at": a.createdAt.isoformat(),
        }
        for a in actions
    ]


@router.post("/{expense_id}/override")
async def admin_override(
    expense_id: str,
    req: OverrideRequest,
    current_user=Depends(require_role("ADMIN")),
):
    expense = await override_expense(expense_id, current_user.id, req.action, req.comment)
    return serialize_expense(expense)
