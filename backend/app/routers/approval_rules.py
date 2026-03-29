from fastapi import APIRouter, HTTPException, Depends

from app.dependencies import db
from app.schemas.approval import CreateApprovalRuleRequest, UpdateApprovalRuleRequest
from app.middleware.role_middleware import require_role

router = APIRouter(prefix="/api/approval-rules", tags=["Approval Rules"])


@router.get("/")
async def list_rules(current_user=Depends(require_role("ADMIN"))):
    rules = await db.approvalrule.find_many(
        where={"companyId": current_user.companyId, "isActive": True},
        include={"steps": {"order_by": {"stepOrder": "asc"}}},
        order={"createdAt": "desc"},
    )
    return [_serialize_rule(r) for r in rules]


@router.post("/")
async def create_rule(
    req: CreateApprovalRuleRequest,
    current_user=Depends(require_role("ADMIN")),
):
    if req.rule_type not in ("PERCENTAGE", "SPECIFIC_USER", "HYBRID"):
        raise HTTPException(status_code=400, detail="Invalid rule type")

    if req.rule_type in ("PERCENTAGE", "HYBRID") and req.percent_required is None:
        raise HTTPException(status_code=400, detail="Percentage required for this rule type")

    if req.rule_type in ("SPECIFIC_USER", "HYBRID") and req.specific_user_id is None:
        raise HTTPException(status_code=400, detail="Specific user required for this rule type")

    if not req.steps or len(req.steps) == 0:
        raise HTTPException(status_code=400, detail="At least one approval step is required")

    # Validate all approver IDs belong to this company
    for step in req.steps:
        approver = await db.user.find_unique(where={"id": step["approver_id"]})
        if not approver or approver.companyId != current_user.companyId:
            raise HTTPException(status_code=400, detail=f"Invalid approver: {step.get('approver_id')}")

    # If setting as default, unset existing default
    if req.is_default:
        await db.approvalrule.update_many(
            where={"companyId": current_user.companyId, "isDefault": True},
            data={"isDefault": False},
        )

    rule = await db.approvalrule.create(
        data={
            "companyId": current_user.companyId,
            "name": req.name,
            "ruleType": req.rule_type,
            "percentRequired": req.percent_required,
            "specificUserId": req.specific_user_id,
            "isDefault": req.is_default,
        }
    )

    # Create ordered steps
    for i, step in enumerate(req.steps):
        await db.approvalrulestep.create(
            data={
                "approvalRuleId": rule.id,
                "stepOrder": i + 1,
                "approverId": step["approver_id"],
                "stepLabel": step.get("step_label"),
            }
        )

    # Refetch with steps
    created = await db.approvalrule.find_unique(
        where={"id": rule.id},
        include={"steps": {"order_by": {"stepOrder": "asc"}}},
    )
    return _serialize_rule(created)


@router.put("/{rule_id}")
async def update_rule(
    rule_id: str,
    req: UpdateApprovalRuleRequest,
    current_user=Depends(require_role("ADMIN")),
):
    rule = await db.approvalrule.find_unique(where={"id": rule_id})
    if not rule or rule.companyId != current_user.companyId:
        raise HTTPException(status_code=404, detail="Rule not found")

    update_data = {}
    if req.name is not None:
        update_data["name"] = req.name
    if req.rule_type is not None:
        update_data["ruleType"] = req.rule_type
    if req.percent_required is not None:
        update_data["percentRequired"] = req.percent_required
    if req.specific_user_id is not None:
        update_data["specificUserId"] = req.specific_user_id

    if update_data:
        await db.approvalrule.update(where={"id": rule_id}, data=update_data)

    # Replace steps if provided
    if req.steps is not None:
        # Delete existing steps
        await db.approvalrulestep.delete_many(where={"approvalRuleId": rule_id})

        for i, step in enumerate(req.steps):
            approver = await db.user.find_unique(where={"id": step["approver_id"]})
            if not approver or approver.companyId != current_user.companyId:
                raise HTTPException(status_code=400, detail=f"Invalid approver: {step.get('approver_id')}")

            await db.approvalrulestep.create(
                data={
                    "approvalRuleId": rule_id,
                    "stepOrder": i + 1,
                    "approverId": step["approver_id"],
                    "stepLabel": step.get("step_label"),
                }
            )

    updated = await db.approvalrule.find_unique(
        where={"id": rule_id},
        include={"steps": {"order_by": {"stepOrder": "asc"}}},
    )
    return _serialize_rule(updated)


@router.delete("/{rule_id}")
async def deactivate_rule(
    rule_id: str,
    current_user=Depends(require_role("ADMIN")),
):
    rule = await db.approvalrule.find_unique(where={"id": rule_id})
    if not rule or rule.companyId != current_user.companyId:
        raise HTTPException(status_code=404, detail="Rule not found")

    await db.approvalrule.update(where={"id": rule_id}, data={"isActive": False})
    return {"detail": "Rule deactivated"}


@router.patch("/{rule_id}/default")
async def set_default_rule(
    rule_id: str,
    current_user=Depends(require_role("ADMIN")),
):
    rule = await db.approvalrule.find_unique(where={"id": rule_id})
    if not rule or rule.companyId != current_user.companyId:
        raise HTTPException(status_code=404, detail="Rule not found")

    # Unset existing default
    await db.approvalrule.update_many(
        where={"companyId": current_user.companyId, "isDefault": True},
        data={"isDefault": False},
    )

    await db.approvalrule.update(where={"id": rule_id}, data={"isDefault": True})
    return {"detail": "Rule set as default"}


def _serialize_rule(rule) -> dict:
    return {
        "id": rule.id,
        "name": rule.name,
        "rule_type": rule.ruleType,
        "percent_required": rule.percentRequired,
        "specific_user_id": rule.specificUserId,
        "is_default": rule.isDefault,
        "is_active": rule.isActive,
        "created_at": rule.createdAt.isoformat(),
        "steps": [
            {
                "id": s.id,
                "step_order": s.stepOrder,
                "approver_id": s.approverId,
                "step_label": s.stepLabel,
            }
            for s in (rule.steps or [])
        ],
    }
