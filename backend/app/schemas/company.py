from pydantic import BaseModel


class CompanyResponse(BaseModel):
    id: str
    name: str
    country: str
    default_currency: str

    model_config = {"from_attributes": True}


class UpdateCompanyRequest(BaseModel):
    name: str | None = None
    default_currency: str | None = None
