from app.dependencies import db


async def approve_expense(expense_id: str, actor_id: str, comment: str | None = None):
    """
    Core approval engine. Handles:
    - Sequential step advancement
    - PERCENTAGE auto-approve (approved/total >= threshold)
    - SPECIFIC_USER auto-approve (specific user approves at any step)
    - HYBRID (either condition triggers auto-approve)
    """
    expense = await db.expense.find_unique(
        where={"id": expense_id},
        include={"approvalSteps": {"order_by": {"stepOrder": "asc"}}},
    )
    if not expense:
        raise ValueError("Expense not found")
    if expense.status not in ("PENDING", "IN_PROGRESS"):
        raise ValueError("Expense is not awaiting approval")

    # Find the current AWAITING step for this actor
    current_step = None
    for step in expense.approvalSteps:
        if step.approverId == actor_id and step.status == "AWAITING":
            current_step = step
            break

    if not current_step:
        raise PermissionError("You are not the current approver for this expense")

    # 1. Mark step as APPROVED
    await db.approvalstep.update(
        where={"id": current_step.id},
        data={"status": "APPROVED"},
    )

    # 2. Create audit record
    await db.approvalaction.create(
        data={
            "expenseId": expense_id,
            "actorId": actor_id,
            "action": "APPROVED",
            "comment": comment,
        }
    )

    # 3. Check conditional rules
    rule = await db.approvalrule.find_first(
        where={
            "companyId": expense.companyId,
            "isDefault": True,
            "isActive": True,
        }
    )

    all_steps = expense.approvalSteps
    total_steps = len(all_steps)
    # Count approved (including the one we just approved)
    approved_count = sum(1 for s in all_steps if s.status == "APPROVED") + 1  # +1 for current

    auto_approved = False

    if rule:
        # SPECIFIC_USER: if actor is the specific user, auto-approve everything
        if rule.ruleType in ("SPECIFIC_USER", "HYBRID") and rule.specificUserId == actor_id:
            await _skip_remaining_steps(expense_id, current_step.stepOrder)
            await db.expense.update(
                where={"id": expense_id},
                data={"status": "APPROVED", "currentStepOrder": current_step.stepOrder},
            )
            auto_approved = True

        # PERCENTAGE / HYBRID: check threshold
        if not auto_approved and rule.ruleType in ("PERCENTAGE", "HYBRID") and rule.percentRequired:
            if total_steps > 0 and (approved_count / total_steps) >= rule.percentRequired:
                await _skip_remaining_steps(expense_id, current_step.stepOrder)
                await db.expense.update(
                    where={"id": expense_id},
                    data={"status": "APPROVED", "currentStepOrder": current_step.stepOrder},
                )
                auto_approved = True

    # 4. If not auto-approved, advance to next step
    if not auto_approved:
        next_step = None
        for step in all_steps:
            if step.stepOrder > current_step.stepOrder and step.status == "PENDING":
                next_step = step
                break

        if next_step:
            await db.approvalstep.update(
                where={"id": next_step.id},
                data={"status": "AWAITING"},
            )
            await db.expense.update(
                where={"id": expense_id},
                data={"status": "IN_PROGRESS", "currentStepOrder": next_step.stepOrder},
            )
        else:
            # No more steps → approved
            await db.expense.update(
                where={"id": expense_id},
                data={"status": "APPROVED", "currentStepOrder": current_step.stepOrder},
            )

    return await db.expense.find_unique(where={"id": expense_id})


async def reject_expense(expense_id: str, actor_id: str, comment: str):
    """Reject an expense. Terminates the workflow."""
    expense = await db.expense.find_unique(
        where={"id": expense_id},
        include={"approvalSteps": {"order_by": {"stepOrder": "asc"}}},
    )
    if not expense:
        raise ValueError("Expense not found")
    if expense.status not in ("PENDING", "IN_PROGRESS"):
        raise ValueError("Expense is not awaiting approval")

    current_step = None
    for step in expense.approvalSteps:
        if step.approverId == actor_id and step.status == "AWAITING":
            current_step = step
            break

    if not current_step:
        raise PermissionError("You are not the current approver for this expense")

    # Mark step as REJECTED
    await db.approvalstep.update(
        where={"id": current_step.id},
        data={"status": "REJECTED"},
    )

    # Audit record
    await db.approvalaction.create(
        data={
            "expenseId": expense_id,
            "actorId": actor_id,
            "action": "REJECTED",
            "comment": comment,
        }
    )

    # Terminate workflow
    await db.expense.update(
        where={"id": expense_id},
        data={"status": "REJECTED", "currentStepOrder": current_step.stepOrder},
    )

    return await db.expense.find_unique(where={"id": expense_id})


async def override_expense(expense_id: str, admin_id: str, action: str, comment: str | None = None):
    """Admin force-approve or force-reject regardless of workflow state."""
    expense = await db.expense.find_unique(
        where={"id": expense_id},
        include={"approvalSteps": True},
    )
    if not expense:
        raise ValueError("Expense not found")

    if action not in ("APPROVED", "REJECTED"):
        raise ValueError("Action must be APPROVED or REJECTED")

    # Skip all remaining steps
    for step in expense.approvalSteps:
        if step.status in ("PENDING", "AWAITING"):
            await db.approvalstep.update(
                where={"id": step.id},
                data={"status": "SKIPPED"},
            )

    # Audit record
    await db.approvalaction.create(
        data={
            "expenseId": expense_id,
            "actorId": admin_id,
            "action": f"OVERRIDE_{action}",
            "comment": comment,
        }
    )

    await db.expense.update(
        where={"id": expense_id},
        data={"status": action},
    )

    return await db.expense.find_unique(where={"id": expense_id})


async def _skip_remaining_steps(expense_id: str, after_order: int):
    """Mark all steps after the given order as SKIPPED."""
    steps = await db.approvalstep.find_many(
        where={
            "expenseId": expense_id,
            "stepOrder": {"gt": after_order},
            "status": {"in": ["PENDING", "AWAITING"]},
        }
    )
    for step in steps:
        await db.approvalstep.update(
            where={"id": step.id},
            data={"status": "SKIPPED"},
        )
