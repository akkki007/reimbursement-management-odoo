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
    remarks: str | None = None,
    paid_by: str = "EMPLOYEE",
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
            "remarks": remarks,
            "paidBy": paid_by,
            "isManagerApprover": is_manager_approver,
            "receiptUrl": receipt_url,
            "ocrVendorName": ocr_vendor_name,
            "ocrRawData": ocr_raw_data,
        }
    )

    return expense


async def submit_expense(expense_id: str, user_id: str):
    """Submit a draft expense — triggers approval workflow generation.

    Handles two modes from the rule:
    - Sequential (isSequential=True): steps go 1→2→3, only current step is AWAITING
    - Parallel (isSequential=False): ALL approvers get AWAITING at once
    Also handles isManagerApprover on the rule (manager goes first regardless).
    """

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

    is_sequential = rule.isSequential if rule else True
    steps_to_create = []
    step_order = 0

    # Manager-first: from expense toggle OR from rule's isManagerApprover
    needs_manager = expense.isManagerApprover or (rule and rule.isManagerApprover)
    if needs_manager:
        user = await db.user.find_unique(where={"id": user_id})
        if user and user.managerId:
            steps_to_create.append({
                "expenseId": expense_id,
                "approverId": user.managerId,
                "stepOrder": step_order,
                "stepLabel": "Manager",
                "isRequired": True,
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
                "isRequired": rule_step.isRequired,
                "status": "PENDING",
            })

    # If no steps at all, auto-approve
    if not steps_to_create:
        await db.expense.update(
            where={"id": expense_id},
            data={"status": "APPROVED", "currentStepOrder": 0},
        )
        return await db.expense.find_unique(where={"id": expense_id})

    # Set initial statuses based on mode
    if is_sequential:
        # Only the first step is AWAITING
        for i, step in enumerate(steps_to_create):
            step["status"] = "AWAITING" if i == 0 else "PENDING"
    else:
        # Parallel: manager step (if any) is AWAITING first, then all others
        # If manager step exists, only it is AWAITING first (manager always goes first)
        has_manager_step = any(s["stepLabel"] == "Manager" for s in steps_to_create)
        if has_manager_step:
            for step in steps_to_create:
                step["status"] = "AWAITING" if step["stepLabel"] == "Manager" else "PENDING"
        else:
            # No manager step, all AWAITING at once
            for step in steps_to_create:
                step["status"] = "AWAITING"

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
        "remarks": expense.remarks,
        "paid_by": expense.paidBy,
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
