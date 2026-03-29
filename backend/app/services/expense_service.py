from decimal import Decimal

from app.dependencies import db
from app.services.currency_service import get_exchange_rate


async def create_expense(
    user_id: str,
    company_id: str,
    amount: Decimal,
    currency: str,
    category: str,
    description: str,
    expense_date,
    is_manager_approver: bool = False,
    receipt_url: str | None = None,
    ocr_vendor_name: str | None = None,
    ocr_raw_data: dict | None = None,
) -> dict:
    """Create a new expense with optional currency conversion."""

    company = await db.company.find_unique(where={"id": company_id})
    if not company:
        raise ValueError("Company not found")

    converted_amount = None
    exchange_rate = None

    if currency != company.defaultCurrency:
        rate = await get_exchange_rate(currency, company.defaultCurrency)
        exchange_rate = Decimal(str(rate))
        converted_amount = amount * exchange_rate

    # Check if user has a manager when manager approval is requested
    if is_manager_approver:
        user = await db.user.find_unique(where={"id": user_id})
        if not user or not user.managerId:
            is_manager_approver = False

    expense = await db.expense.create(
        data={
            "companyId": company_id,
            "submittedById": user_id,
            "amount": float(amount),
            "currency": currency,
            "convertedAmount": float(converted_amount) if converted_amount else None,
            "exchangeRate": float(exchange_rate) if exchange_rate else None,
            "category": category,
            "description": description,
            "expenseDate": expense_date,
            "status": "DRAFT",
            "isManagerApprover": is_manager_approver,
            "receiptUrl": receipt_url,
            "ocrVendorName": ocr_vendor_name,
            "ocrRawData": ocr_raw_data,
        }
    )

    return expense


async def submit_expense(expense_id: str, user_id: str):
    """Submit a draft expense — triggers approval workflow generation."""

    expense = await db.expense.find_unique(where={"id": expense_id})
    if not expense:
        raise ValueError("Expense not found")
    if expense.submittedById != user_id:
        raise PermissionError("Not your expense")
    if expense.status != "DRAFT":
        raise ValueError("Only draft expenses can be submitted")

    # Find the company's default active approval rule
    rule = await db.approvalrule.find_first(
        where={
            "companyId": expense.companyId,
            "isDefault": True,
            "isActive": True,
        },
        include={"steps": True},
    )

    steps_to_create = []
    step_order = 0

    # If manager approval requested and user has a manager, add as step 0
    if expense.isManagerApprover:
        user = await db.user.find_unique(where={"id": user_id})
        if user and user.managerId:
            steps_to_create.append({
                "expenseId": expense_id,
                "approverId": user.managerId,
                "stepOrder": step_order,
                "stepLabel": "Manager",
                "status": "AWAITING",
            })
            step_order += 1

    # Add rule-defined steps
    if rule and rule.steps:
        sorted_steps = sorted(rule.steps, key=lambda s: s.stepOrder)
        for i, rule_step in enumerate(sorted_steps):
            steps_to_create.append({
                "expenseId": expense_id,
                "approverId": rule_step.approverId,
                "stepOrder": step_order + i,
                "stepLabel": rule_step.stepLabel,
                "status": "AWAITING" if (step_order + i == 0 or (step_order == 0 and i == 0)) else "PENDING",
            })

    # If no steps at all, auto-approve
    if not steps_to_create:
        await db.expense.update(
            where={"id": expense_id},
            data={"status": "APPROVED", "currentStepOrder": 0},
        )
        return await db.expense.find_unique(where={"id": expense_id})

    # Ensure only the first step is AWAITING
    for i, step in enumerate(steps_to_create):
        step["status"] = "AWAITING" if i == 0 else "PENDING"

    # Create all approval steps
    for step_data in steps_to_create:
        await db.approvalstep.create(data=step_data)

    # Update expense status to PENDING
    await db.expense.update(
        where={"id": expense_id},
        data={"status": "PENDING", "currentStepOrder": 0},
    )

    return await db.expense.find_unique(where={"id": expense_id})


def serialize_expense(expense) -> dict:
    """Convert a Prisma expense object to a JSON-serializable dict."""
    return {
        "id": expense.id,
        "amount": float(expense.amount),
        "currency": expense.currency,
        "converted_amount": float(expense.convertedAmount) if expense.convertedAmount else None,
        "exchange_rate": float(expense.exchangeRate) if expense.exchangeRate else None,
        "category": expense.category,
        "description": expense.description,
        "receipt_url": expense.receiptUrl,
        "expense_date": expense.expenseDate.isoformat(),
        "status": expense.status,
        "is_manager_approver": expense.isManagerApprover,
        "current_step_order": expense.currentStepOrder,
        "submitted_by_id": expense.submittedById,
        "company_id": expense.companyId,
        "ocr_vendor_name": expense.ocrVendorName,
        "created_at": expense.createdAt.isoformat(),
        "updated_at": expense.updatedAt.isoformat(),
    }
