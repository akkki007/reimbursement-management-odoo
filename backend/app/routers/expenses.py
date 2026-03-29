import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File

from app.dependencies import db
from app.middleware.auth_middleware import get_current_user
from app.middleware.role_middleware import require_role
from app.schemas.expense import CreateExpenseRequest, UpdateExpenseRequest
from app.services.expense_service import (
    create_expense,
    submit_expense,
    serialize_expense,
)
from app.services.ocr_service import parse_receipt

router = APIRouter(prefix="/api/expenses", tags=["Expenses"])


@router.get("/stats")
async def get_expense_stats(current_user=Depends(get_current_user)):
    """Dashboard stats: counts by status, total amounts."""
    where_base = {"companyId": current_user.companyId}
    if current_user.role == "EMPLOYEE":
        where_base["submittedById"] = current_user.id

    all_expenses = await db.expense.find_many(where=where_base)

    counts = {"DRAFT": 0, "PENDING": 0, "IN_PROGRESS": 0, "APPROVED": 0, "REJECTED": 0}
    total_amount = 0.0
    for e in all_expenses:
        counts[e.status] = counts.get(e.status, 0) + 1
        total_amount += float(e.convertedAmount or e.amount)

    # Pending approvals for this user
    pending_approvals = 0
    if current_user.role in ("MANAGER", "ADMIN"):
        steps = await db.approvalstep.find_many(
            where={"approverId": current_user.id, "status": "AWAITING"}
        )
        pending_approvals = len(steps)

    return {
        "counts": counts,
        "total_submitted": len(all_expenses),
        "total_amount": total_amount,
        "pending_approvals": pending_approvals,
    }


@router.post("/")
async def create_and_submit_expense(
    req: CreateExpenseRequest,
    current_user=Depends(require_role("EMPLOYEE")),
):
    """Create an expense and immediately submit it for approval."""
    expense = await create_expense(
        user_id=current_user.id,
        company_id=current_user.companyId,
        amount=req.amount,
        currency=req.currency,
        category=req.category,
        description=req.description,
        remarks=req.remarks,
        paid_by=req.paid_by,
        expense_date=req.expense_date,
        is_manager_approver=req.is_manager_approver,
        receipt_url=req.receipt_url,
        ocr_vendor_name=req.ocr_vendor_name,
        ocr_raw_data=req.ocr_raw_data,
    )

    # Immediately submit (triggers workflow)
    submitted = await submit_expense(expense.id, current_user.id)
    return serialize_expense(submitted)


@router.post("/draft")
async def save_draft_expense(
    req: CreateExpenseRequest,
    current_user=Depends(require_role("EMPLOYEE")),
):
    """Save an expense as draft without submitting."""
    expense = await create_expense(
        user_id=current_user.id,
        company_id=current_user.companyId,
        amount=req.amount,
        currency=req.currency,
        category=req.category,
        description=req.description,
        remarks=req.remarks,
        paid_by=req.paid_by,
        expense_date=req.expense_date,
        is_manager_approver=req.is_manager_approver,
        receipt_url=req.receipt_url,
        ocr_vendor_name=req.ocr_vendor_name,
        ocr_raw_data=req.ocr_raw_data,
    )
    return serialize_expense(expense)


@router.post("/{expense_id}/submit")
async def submit_draft(
    expense_id: str,
    current_user=Depends(require_role("EMPLOYEE")),
):
    """Submit a previously saved draft expense."""
    submitted = await submit_expense(expense_id, current_user.id)
    return serialize_expense(submitted)


@router.get("/")
async def list_expenses(
    current_user=Depends(get_current_user),
    status: str | None = Query(None),
    category: str | None = Query(None),
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
):
    """List expenses for the current user. Admins see all company expenses."""
    where = {"companyId": current_user.companyId}

    if current_user.role == "EMPLOYEE":
        where["submittedById"] = current_user.id
    elif current_user.role == "MANAGER":
        # Managers see their own + their subordinates' expenses
        subordinates = await db.user.find_many(
            where={"managerId": current_user.id}
        )
        sub_ids = [s.id for s in subordinates]
        sub_ids.append(current_user.id)
        where["submittedById"] = {"in": sub_ids}
    # ADMIN sees all company expenses (no extra filter)

    if status:
        where["status"] = status
    if category:
        where["category"] = category
    if date_from:
        where["expenseDate"] = {**(where.get("expenseDate") or {}), "gte": date_from}
    if date_to:
        where["expenseDate"] = {**(where.get("expenseDate") or {}), "lte": date_to}

    expenses = await db.expense.find_many(
        where=where,
        order={"createdAt": "desc"},
        include={"submittedBy": True},
    )

    result = []
    for e in expenses:
        data = serialize_expense(e)
        data["submitted_by_name"] = f"{e.submittedBy.firstName} {e.submittedBy.lastName}"
        result.append(data)

    return result


@router.get("/{expense_id}")
async def get_expense(expense_id: str, current_user=Depends(get_current_user)):
    """Get expense detail with approval steps."""
    expense = await db.expense.find_unique(
        where={"id": expense_id},
        include={
            "submittedBy": True,
            "approvalSteps": {
                "include": {"approver": True},
                "order_by": {"stepOrder": "asc"},
            },
            "approvalActions": {
                "include": {"actor": True},
                "order_by": {"createdAt": "asc"},
            },
        },
    )

    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    if expense.companyId != current_user.companyId:
        raise HTTPException(status_code=403, detail="Access denied")

    # Employees can only see their own
    if current_user.role == "EMPLOYEE" and expense.submittedById != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    data = serialize_expense(expense)
    data["submitted_by_name"] = f"{expense.submittedBy.firstName} {expense.submittedBy.lastName}"
    data["submitted_by_email"] = expense.submittedBy.email

    data["approval_steps"] = [
        {
            "id": s.id,
            "step_order": s.stepOrder,
            "step_label": s.stepLabel,
            "status": s.status,
            "approver_id": s.approverId,
            "approver_name": f"{s.approver.firstName} {s.approver.lastName}",
        }
        for s in expense.approvalSteps
    ]

    data["approval_actions"] = [
        {
            "id": a.id,
            "action": a.action,
            "comment": a.comment,
            "actor_id": a.actorId,
            "actor_name": f"{a.actor.firstName} {a.actor.lastName}",
            "created_at": a.createdAt.isoformat(),
        }
        for a in expense.approvalActions
    ]

    return data


@router.patch("/{expense_id}")
async def update_expense(
    expense_id: str,
    req: UpdateExpenseRequest,
    current_user=Depends(get_current_user),
):
    """Edit a draft expense."""
    expense = await db.expense.find_unique(where={"id": expense_id})

    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    if expense.submittedById != current_user.id:
        raise HTTPException(status_code=403, detail="Not your expense")
    if expense.status != "DRAFT":
        raise HTTPException(status_code=400, detail="Can only edit draft expenses")

    update_data = {}
    if req.amount is not None:
        update_data["amount"] = float(req.amount)
    if req.currency is not None:
        update_data["currency"] = req.currency
    if req.category is not None:
        update_data["category"] = req.category
    if req.description is not None:
        update_data["description"] = req.description
    if req.expense_date is not None:
        update_data["expenseDate"] = req.expense_date
    if req.is_manager_approver is not None:
        update_data["isManagerApprover"] = req.is_manager_approver

    updated = await db.expense.update(
        where={"id": expense_id},
        data=update_data,
    )
    return serialize_expense(updated)


@router.post("/upload-receipt")
async def upload_receipt(
    file: UploadFile = File(...),
    current_user=Depends(require_role("EMPLOYEE")),
):
    """Upload a receipt file and return its URL."""
    if not file.content_type or not (
        file.content_type.startswith("image/") or file.content_type == "application/pdf"
    ):
        raise HTTPException(status_code=400, detail="Only images and PDFs are accepted")

    ext = Path(file.filename).suffix if file.filename else ".bin"
    filename = f"{uuid.uuid4().hex}{ext}"
    uploads_dir = Path(__file__).resolve().parent.parent.parent / "uploads"
    uploads_dir.mkdir(exist_ok=True)
    filepath = uploads_dir / filename

    content = await file.read()
    filepath.write_bytes(content)

    return {"receipt_url": f"/uploads/{filename}"}


@router.post("/scan-receipt")
async def scan_receipt(
    file: UploadFile = File(...),
    current_user=Depends(require_role("EMPLOYEE")),
):
    """Upload a receipt image and get OCR-parsed fields."""
    if not file.content_type or not (
        file.content_type.startswith("image/") or file.content_type == "application/pdf"
    ):
        raise HTTPException(status_code=400, detail="Only images and PDFs are accepted")

    result = await parse_receipt(file)
    return result
