from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class CreateExpenseRequest(BaseModel):
    amount: Decimal = Field(..., gt=0, le=999999999999)
    currency: str = Field(..., min_length=3, max_length=3)
    category: str = Field(..., max_length=50)
    description: str = Field(..., min_length=1, max_length=1000)
    remarks: str | None = Field(None, max_length=2000)
    paid_by: str = "EMPLOYEE"
    expense_date: datetime
    is_manager_approver: bool = False
    receipt_url: str | None = Field(None, max_length=500)
    ocr_vendor_name: str | None = Field(None, max_length=200)
    ocr_raw_data: dict | None = None


class UpdateExpenseRequest(BaseModel):
    amount: Decimal | None = Field(None, gt=0, le=999999999999)
    currency: str | None = Field(None, min_length=3, max_length=3)
    category: str | None = Field(None, max_length=50)
    description: str | None = Field(None, max_length=1000)
    remarks: str | None = Field(None, max_length=2000)
    paid_by: str | None = None
    expense_date: datetime | None = None
    is_manager_approver: bool | None = None


class ExpenseResponse(BaseModel):
    id: str
    amount: float
    currency: str
    converted_amount: float | None = None
    exchange_rate: float | None = None
    category: str
    description: str
    receipt_url: str | None = None
    expense_date: str
    status: str
    is_manager_approver: bool
    current_step_order: int
    submitted_by_id: str
    company_id: str
    ocr_vendor_name: str | None = None
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class ExpenseListFilter(BaseModel):
    status: str | None = None
    category: str | None = None
    date_from: datetime | None = None
    date_to: datetime | None = None
