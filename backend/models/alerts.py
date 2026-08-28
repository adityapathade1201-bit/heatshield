from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

RiskLevel = Literal["low", "moderate", "high", "severe"]


class HeatAlert(BaseModel):
    id: str
    alert_type: str
    severity: RiskLevel
    ward: str
    risk_score: int = Field(ge=0, le=100)
    current_risk_score: int = Field(ge=0, le=100)
    expected_peak_score: int = Field(ge=0, le=100)
    expected_peak_time: str
    created_at: datetime
    status: Literal["active", "acknowledged", "resolved"]
    recommended_response: str


class AlertsResponse(BaseModel):
    alerts: list[HeatAlert]
    active_count: int
