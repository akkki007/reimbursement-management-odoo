from app.dependencies import db


async def approve_expense(expense_id: str, actor_id: str, comment: str | None = None):
    """
    Core approval engine. Handles:
    - Sequential mode: advance step by step (1→2→3)
    - Parallel mode: all approvers get notified at once
    - Required approvers: must approve regardless of percentage
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

    # Find the AWAITING step for this actor
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

    # 3. Load rule for conditional checks
    rule = await db.approvalrule.find_first(
        where={
            "companyId": expense.companyId,
            "isDefault": True,
            "isActive": True,
        }
    )

    all_steps = expense.approvalSteps
    total_steps = len(all_steps)
    approved_count = sum(1 for s in all_steps if s.status == "APPROVED") + 1  # +1 for current
    is_sequential = rule.isSequential if rule else True

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

        # PERCENTAGE / HYBRID: check threshold, but also check all required approvers are done
        if not auto_approved and rule.ruleType in ("PERCENTAGE", "HYBRID") and rule.percentRequired:
            if total_steps > 0 and (approved_count / total_steps) >= rule.percentRequired:
                # Check if all required approvers have approved
                required_pending = [
                    s for s in all_steps
                    if s.isRequired and s.status not in ("APPROVED", "SKIPPED") and s.id != current_step.id
                ]
                if not required_pending:
                    await _skip_remaining_steps(expense_id, current_step.stepOrder)
                    await db.expense.update(
                        where={"id": expense_id},
                        data={"status": "APPROVED", "currentStepOrder": current_step.stepOrder},
                    )
                    auto_approved = True

    # 4. If not auto-approved, handle next step(s)
    if not auto_approved:
        if is_sequential:
            # Sequential: advance to next pending step
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
        else:
            # Parallel mode: check if this was a manager step that gates others
            if current_step.stepLabel == "Manager":
                # Manager done, now open all remaining to AWAITING
                pending_steps = [s for s in all_steps if s.status == "PENDING"]
                for step in pending_steps:
                    await db.approvalstep.update(
                        where={"id": step.id},
                        data={"status": "AWAITING"},
                    )
                if pending_steps:
                    await db.expense.update(
                        where={"id": expense_id},
                        data={"status": "IN_PROGRESS", "currentStepOrder": current_step.stepOrder},
                    )
                else:
                    await db.expense.update(
                        where={"id": expense_id},
                        data={"status": "APPROVED", "currentStepOrder": current_step.stepOrder},
                    )
            else:
                # Check if all AWAITING steps are resolved (no more AWAITING except already done)
                still_awaiting = [
                    s for s in all_steps
                    if s.status == "AWAITING" and s.id != current_step.id
                ]
                still_pending = [s for s in all_steps if s.status == "PENDING"]

                if not still_awaiting and not still_pending:
                    # Everyone has acted → approved
                    await db.expense.update(
                        where={"id": expense_id},
                        data={"status": "APPROVED", "currentStepOrder": current_step.stepOrder},
                    )
                else:
                    await db.expense.update(
                        where={"id": expense_id},
                        data={"status": "IN_PROGRESS", "currentStepOrder": current_step.stepOrder},
                    )

    return await db.expense.find_unique(where={"id": expense_id})


async def reject_expense(expense_id: str, actor_id: str, comment: str):
    """Reject an expense.

    If the rejecting approver is a required approver → auto-reject entire expense.
    Otherwise in parallel mode, just mark as rejected but don't terminate
    unless all have acted.
    """
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

    # If required approver rejects → entire expense is rejected
    # In sequential mode → any rejection terminates
    rule = await db.approvalrule.find_first(
        where={"companyId": expense.companyId, "isDefault": True, "isActive": True}
    )
    is_sequential = rule.isSequential if rule else True

    if current_step.isRequired or is_sequential:
        # Terminate workflow
        await _skip_remaining_steps(expense_id, -1)  # skip ALL remaining
        await db.expense.update(
            where={"id": expense_id},
            data={"status": "REJECTED", "currentStepOrder": current_step.stepOrder},
        )
    else:
        # Parallel + non-required: check if everyone has acted
        all_steps = expense.approvalSteps
        still_awaiting = [
            s for s in all_steps
            if s.status == "AWAITING" and s.id != current_step.id
        ]
        if not still_awaiting:
            # Everyone acted, check percentage threshold
            approved_count = sum(1 for s in all_steps if s.status == "APPROVED")
            total = len(all_steps)
            threshold = rule.percentRequired if rule and rule.percentRequired else 1.0
            if total > 0 and (approved_count / total) >= threshold:
                await db.expense.update(
                    where={"id": expense_id},
                    data={"status": "APPROVED", "currentStepOrder": current_step.stepOrder},
                )
            else:
                await db.expense.update(
                    where={"id": expense_id},
                    data={"status": "REJECTED", "currentStepOrder": current_step.stepOrder},
                )
        else:
            await db.expense.update(
                where={"id": expense_id},
                data={"status": "IN_PROGRESS", "currentStepOrder": current_step.stepOrder},
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
    """Mark all steps after the given order as SKIPPED. Use -1 to skip ALL."""
    where_clause = {
        "expenseId": expense_id,
        "status": {"in": ["PENDING", "AWAITING"]},
    }
    if after_order >= 0:
        where_clause["stepOrder"] = {"gt": after_order}

    steps = await db.approvalstep.find_many(where=where_clause)
    for step in steps:
        await db.approvalstep.update(
            where={"id": step.id},
            data={"status": "SKIPPED"},
        )
