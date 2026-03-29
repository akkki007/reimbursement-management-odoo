from enum import Enum


class Role(str, Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    EMPLOYEE = "EMPLOYEE"


class ExpenseStatus(str, Enum):
    DRAFT = "DRAFT"
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class ExpenseCategory(str, Enum):
    TRAVEL = "TRAVEL"
    MEALS = "MEALS"
    ACCOMMODATION = "ACCOMMODATION"
    OFFICE_SUPPLIES = "OFFICE_SUPPLIES"
    TRANSPORT = "TRANSPORT"
    ENTERTAINMENT = "ENTERTAINMENT"
    SOFTWARE = "SOFTWARE"
    OTHER = "OTHER"


class ApprovalRuleType(str, Enum):
    PERCENTAGE = "PERCENTAGE"
    SPECIFIC_USER = "SPECIFIC_USER"
    HYBRID = "HYBRID"


class ApprovalStepStatus(str, Enum):
    PENDING = "PENDING"
    AWAITING = "AWAITING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    SKIPPED = "SKIPPED"
