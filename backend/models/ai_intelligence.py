"""Pydantic schemas for Phase 7 AI Municipal Heat Intelligence decision-support layer."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from models.risk import RiskLevel


class DataQualityStatus(BaseModel):
    """Data quality and metrics availability tracking."""

    live_weather: Literal["Available", "Degraded", "Unavailable"] = Field(
        default="Available", description="Live weather provider status"
    )
    forecast: Literal["Available", "Degraded", "Unavailable"] = Field(
        default="Available", description="Open-Meteo forecast provider status"
    )
    thermal_metrics: Literal["Available", "Degraded", "Unavailable"] = Field(
        default="Available", description="NWS / WBGT thermal calculation status"
    )
    ward_coordinates: Literal["Available", "Degraded", "Unavailable"] = Field(
        default="Available", description="Municipal ward coordinate mapping status"
    )
    overall_status: Literal["Optimal", "Sufficient", "Limited"] = Field(
        default="Optimal", description="Overall data quality assessment"
    )
    limitation_message: str | None = Field(
        default=None, description="Optional warning message if data quality is limited"
    )


class WardAIAnalysisResponse(BaseModel):
    """Explainable AI breakdown for a specific municipal ward."""

    ward: str = Field(description="Municipal ward name e.g. 'Shivajinagar'")
    ward_id: str = Field(description="Ward identifier e.g. 'ward-shivajinagar'")
    current_risk_score: int = Field(ge=0, le=100, description="Current point-in-time risk score")
    current_risk_level: RiskLevel = Field(description="Current risk level")
    heat_index_c: float = Field(description="Live NWS Heat Index in °C")
    relative_humidity: float = Field(description="Relative humidity %")
    solar_radiation_w_m2: float = Field(description="Solar radiation in W/m²")
    uv_index: float = Field(description="Live UV Index")
    wbgt_c: float = Field(description="Estimated WBGT in °C")
    forecast_peak_score: int = Field(ge=0, le=100, description="Forecast peak risk score")
    forecast_peak_level: RiskLevel = Field(description="Forecast peak risk level")
    forecast_peak_time: str = Field(description="Forecast peak time e.g. '11:30 AM'")
    interpretation: str = Field(
        description="Data-driven explainable synthesis of current vs forecast conditions"
    )
    primary_driver: str = Field(description="Primary thermal stress factor e.g. 'Heat Index'")
    supporting_factors: list[dict[str, str]] = Field(
        description="List of supporting factors with actual measurements e.g. [{'label': 'Relative Humidity', 'value': '68%'}]"
    )


class PriorityWardItem(BaseModel):
    """AI Municipal priority ward ranking item."""

    rank: int = Field(ge=1, description="Priority rank position e.g. 1")
    ward: str = Field(description="Ward name")
    ward_id: str = Field(description="Ward ID")
    priority_level: Literal["High", "Medium", "Standard"] = Field(description="Priority category")
    current_score: int = Field(ge=0, le=100, description="Current risk score")
    peak_score: int = Field(ge=0, le=100, description="Forecast peak risk score")
    peak_time: str = Field(description="Forecast peak time")
    trend: Literal["Increasing", "Stable", "Decreasing"] = Field(description="Risk trend direction")
    reason: str = Field(description="Data-backed rationale for priority rank")


class WardComparisonRow(BaseModel):
    """Ward heat intelligence comparison table row."""

    ward: str = Field(description="Ward name")
    ward_id: str = Field(description="Ward ID")
    current_score: int = Field(ge=0, le=100, description="Current risk score")
    current_level: RiskLevel = Field(description="Current risk level")
    peak_score: int = Field(ge=0, le=100, description="Forecast peak risk score")
    peak_time: str = Field(description="Forecast peak time")
    trend: Literal["Increasing", "Stable", "Decreasing"] = Field(description="Risk trend direction")
    priority: Literal["High", "Medium", "Standard"] = Field(description="Priority classification")


class MunicipalBriefResponse(BaseModel):
    """Structured municipal heat operational brief under 120 words."""

    situation: str = Field(description="Current citywide situation summary")
    highest_concern_ward: str = Field(description="Ward of highest thermal concern")
    current_risk_score: int = Field(ge=0, le=100, description="Current city risk score")
    current_risk_level: RiskLevel = Field(description="Current city risk level")
    forecast_peak_score: int = Field(ge=0, le=100, description="City forecast peak score")
    forecast_peak_level: RiskLevel = Field(description="City forecast peak level")
    forecast_peak_time: str = Field(description="City forecast peak time")
    priority_action: str = Field(description="Top priority municipal operational action")
    recommended_preparation: str = Field(description="Recommended preparedness step before peak")
    watch_window: str = Field(description="Critical watch window e.g. '11:00 AM - 02:00 PM'")
    brief_text: str = Field(description="Full formatted brief paragraph under 120 words")
    word_count: int = Field(description="Word count of brief_text")
    generated_at: datetime = Field(description="Generation timestamp in UTC")
    disclaimer: str = Field(
        default="Advisory municipal decision-support summary based on live weather and thermal model outputs."
    )


class ActionExplanationResponse(BaseModel):
    """Data-backed rationale for a recommended action."""

    action_id: str = Field(description="Action ID e.g. 'act-1'")
    title: str = Field(description="Action title")
    primary_factor: str = Field(description="Primary thermal factor driving action")
    supporting_factors: list[dict[str, str]] = Field(description="Supporting weather/risk values")
    data_driven_reason: str = Field(description="Explanation of why this action is recommended")


class AIOverviewResponse(BaseModel):
    """Comprehensive AI Heat Intelligence overview payload."""

    city_risk_score: int = Field(ge=0, le=100, description="Current city risk score")
    city_risk_level: RiskLevel = Field(description="Current city risk level")
    highest_risk_ward: str = Field(description="Ward with highest risk score")
    expected_peak_time: str = Field(description="City expected peak time")
    expected_peak_score: int = Field(ge=0, le=100, description="City expected peak score")
    trend: Literal["Increasing", "Stable", "Decreasing"] = Field(description="Risk trend direction")
    active_warnings_count: int = Field(ge=0, description="Count of active warnings")
    ward_comparisons: list[WardComparisonRow] = Field(description="Comparison table rows")
    priority_recommendations: list[PriorityWardItem] = Field(description="Priority recommendations")
    data_quality: DataQualityStatus = Field(description="Data quality indicators")
    system_note: str = Field(
        default="System Mode: Explainable Decision-Support Layer (Deterministic Rule & Risk Engine Synthesis)"
    )
