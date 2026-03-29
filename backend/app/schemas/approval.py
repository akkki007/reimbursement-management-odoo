from pydantic import BaseModel


class ApproveRequest(BaseModel):
    comment: str | None = None


class RejectRequest(BaseModel):
    comment: str


class OverrideRequest(BaseModel):
    action: str  # "APPROVED" or "REJECTED"
    comment: str | None = None


class CreateApprovalRuleRequest(BaseModel):
    name: str
    rule_type: str = "PERCENTAGE"
    percent_required: float | None = None
    specific_user_id: str | None = None
    is_default: bool = False
    steps: list[dict]  # [{"approver_id": "...", "step_label": "..."}]


class UpdateApprovalRuleRequest(BaseModel):
    name: str | None = None
    rule_type: str | None = None
    percent_required: float | None = None
    specific_user_id: str | None = None
    steps: list[dict] | None = None


class ApprovalStepResponse(BaseModel):
    id: str
    step_order: int
    step_label: str | None = None
    status: str
    approver_id: str

    model_config = {"from_attributes": True}


class ApprovalActionResponse(BaseModel):
    id: str
    action: str
    comment: str | None = None
    actor_id: str
    created_at: str

    model_config = {"from_attributes": True}
