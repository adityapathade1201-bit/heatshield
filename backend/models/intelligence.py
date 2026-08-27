"""Pydantic schemas for Phase 6 historical trends, early warnings, alerts, and response tracking."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from models.risk import RiskLevel


class HourlyHeatPoint(BaseModel):
    """Calculated heat risk and thermal point for a single hour."""

    time: datetime = Field(description="Observation timestamp in UTC")
    formatted_time: str = Field(description="Formatted local Pune time e.g. '09:00 AM'")
    temperature_c: float = Field(description="Air temperature in Celsius")
    apparent_temperature_c: float | None = Field(default=None, description="Apparent temperature in Celsius")
    humidity_percent: float | None = Field(default=None, description="Relative humidity percentage")
    heat_index_c: float | None = Field(default=None, description="NWS Heat Index in Celsius")
    estimated_wbgt_c: float | None = Field(default=None, description="Estimated WBGT in Celsius")
    uv_index: float | None = Field(default=None, description="UV index")
    risk_score: int = Field(ge=0, le=100, description="Calculated heat risk score 0-100")
    risk_level: RiskLevel = Field(description="Calculated risk level")
    is_peak: bool = Field(default=False, description="True if this observation represents today's maximum risk")


class TrendsResponse(BaseModel):
    """24-hour heat trend response."""

    location: str = Field(description="Location name e.g. Pune or Ward name")
    latitude: float = Field(description="Latitude coordinate")
    longitude: float = Field(description="Longitude coordinate")
    generated_at: datetime = Field(description="Generation timestamp in UTC")
    points: list[HourlyHeatPoint] = Field(description="List of hourly heat points")
    peak_point: HourlyHeatPoint | None = Field(default=None, description="Peak risk point for the period")


class HeatAlert(BaseModel):
    """Municipal heat risk alert."""

    id: str = Field(description="Unique alert identifier e.g. 'alert-shivajinagar-01'")
    alert_type: Literal["forecast_warning", "current_alert", "early_warning"] = Field(
        default="forecast_warning",
        description="Type of alert e.g. 'forecast_warning', 'current_alert', 'early_warning'"
    )
    severity: RiskLevel = Field(description="Alert severity level")
    ward: str = Field(description="Municipal ward name")
    ward_id: str = Field(description="Ward identifier")
    risk_score: int = Field(ge=0, le=100, description="Forecast peak risk score 0-100")
    current_risk_score: int = Field(default=11, ge=0, le=100, description="Current point-in-time risk score 0-100")
    expected_peak_score: int = Field(default=27, ge=0, le=100, description="Expected forecast peak risk score 0-100")
    expected_peak_time: str = Field(description="Expected peak time e.g. '12:30 PM'")
    created_at: str = Field(description="Observed/created timestamp e.g. 'Today, 09:00 AM'")
    status: Literal["active", "acknowledged", "resolved"] = Field(default="active", description="Alert status")
    recommended_response: str = Field(description="Recommended response action")



class AlertsResponse(BaseModel):
    """Response containing active and historical municipal alerts."""

    alerts: list[HeatAlert] = Field(description="List of municipal alerts")
    active_count: int = Field(ge=0, description="Number of active alerts")


class ResponseActionItem(BaseModel):
    """Operational response action item."""

    id: str = Field(description="Action identifier")
    title: str = Field(description="Action title")
    description: str = Field(description="Action details")
    audience: str = Field(description="Target audience e.g. 'Ward offices'")
    stage: Literal["BEFORE PEAK", "DURING PEAK", "AFTER PEAK"] = Field(description="Operational timeline stage")
    priority: Literal["Plan ahead", "Today", "Immediate"] = Field(description="Urgency priority")
    status: Literal["pending", "in_progress", "completed"] = Field(default="pending", description="Action execution status")


class ResponseActionsResponse(BaseModel):
    """Response containing response actions and counts."""

    actions: list[ResponseActionItem] = Field(description="List of response actions")
    pending_count: int = Field(ge=0, description="Number of pending actions")
    completed_count: int = Field(ge=0, description="Number of completed actions")


class MunicipalResponseSummary(BaseModel):
    """Dynamic summary metrics for municipal heat response."""

    active_alerts: int = Field(ge=0, description="Count of active heat alerts")
    high_risk_wards: int = Field(ge=0, description="Count of wards with elevated/high risk")
    actions_pending: int = Field(ge=0, description="Count of pending response actions")
    actions_completed: int = Field(ge=0, description="Count of completed response actions")


class StatusUpdatePayload(BaseModel):
    """Payload for updating status of an alert or action."""

    status: str = Field(description="New status string e.g. 'acknowledged' or 'completed'")
