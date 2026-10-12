
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class WebsiteCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    url: HttpUrl
    check_interval_seconds: int = Field(
        default=60, ge=15, le=3600
    )


class WebsiteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    url: str
    check_interval_seconds: int
    is_active: bool
    created_at: datetime


class CheckResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    website_id: int
    is_up: bool
    status_code: int | None
    response_time_ms: float | None
    error_message: str | None
    checked_at: datetime

class IncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    website_id: int
    started_at: datetime
    resolved_at: datetime | None
    status: str
    description: str
