"""Service logic for Phase 6 historical intelligence, early warnings, alerts, and response tracking."""

from datetime import UTC, datetime
from threading import Lock
from typing import Literal

from models.intelligence import (
    AlertsResponse,
    HeatAlert,
    HourlyHeatPoint,
    MunicipalResponseSummary,
    ResponseActionItem,
    ResponseActionsResponse,
    TrendsResponse,
)
from models.risk import RiskLevel
from models.weather import WeatherResponse
from services.thermal_service import ThermalCalculationError, calculate_thermal_stress, thermal_inputs_from_weather
from services.risk_service import PUNE_WARDS, calculate_risk_assessment
from services.weather_service import (
    DEFAULT_LATITUDE,
    DEFAULT_LONGITUDE,
    WeatherServiceError,
    format_pune_time,
    get_forecast,
)



class IntelligenceServiceError(Exception):
    """Raised when intelligence data processing fails."""


_state_lock = Lock()
_alert_status_store: dict[str, str] = {}
_action_status_store: dict[str, str] = {}

DEFAULT_ACTIONS: list[dict] = [
    {
        "id": "act-1",
        "title": "Prepare hydration resources",
        "description": "Ensure public parks, transit stops, and markets have accessible drinking water supplies.",
        "audience": "Ward offices",
        "stage": "BEFORE PEAK",
        "priority": "Plan ahead",
        "status": "pending",
    },
    {
        "id": "act-2",
        "title": "Verify cooling locations",
        "description": "Confirm operational readiness and air conditioning/shade at municipal libraries and shelters.",
        "audience": "Health teams",
        "stage": "BEFORE PEAK",
        "priority": "Plan ahead",
        "status": "pending",
    },
    {
        "id": "act-3",
        "title": "Check ORS availability",
        "description": "Verify inventory of oral rehydration salts (ORS) at local primary healthcare centers.",
        "audience": "Health teams",
        "stage": "BEFORE PEAK",
        "priority": "Plan ahead",
        "status": "pending",
    },
    {
        "id": "act-4",
        "title": "Notify field teams",
        "description": "Issue operational heat advisory and mandatory break schedules to outdoor municipal maintenance staff.",
        "audience": "Field operations",
        "stage": "BEFORE PEAK",
        "priority": "Plan ahead",
        "status": "pending",
    },
    {
        "id": "act-5",
        "title": "Monitor outdoor workers",
        "description": "Enforce mandatory shaded rest breaks and hydration for high-exposure outdoor labor teams.",
        "audience": "Field operations",
        "stage": "DURING PEAK",
        "priority": "Today",
        "status": "pending",
    },
    {
        "id": "act-6",
        "title": "Activate cooling centers",
        "description": "Open public shaded municipal cooling facilities to vulnerable pedestrians and commuters.",
        "audience": "Ward offices",
        "stage": "DURING PEAK",
        "priority": "Today",
        "status": "pending",
    },
    {
        "id": "act-7",
        "title": "Increase public messaging",
        "description": "Broadcast heat avoidance guidance via municipal public announcement systems and digital boards.",
        "audience": "Communications team",
        "stage": "DURING PEAK",
        "priority": "Today",
        "status": "pending",
    },
    {
        "id": "act-8",
        "title": "Monitor high-risk wards",
        "description": "Dispatch mobile health assistance units to high-density commercial hubs and transit stations.",
        "audience": "Health teams",
        "stage": "DURING PEAK",
        "priority": "Today",
        "status": "pending",
    },
    {
        "id": "act-9",
        "title": "Review heat incidents",
        "description": "Collect and summarize heat-stress medical incidence reports from primary health centers.",
        "audience": "Health teams",
        "stage": "AFTER PEAK",
        "priority": "Plan ahead",
        "status": "pending",
    },
    {
        "id": "act-10",
        "title": "Reassess resource levels",
        "description": "Restock drinking water stations and ORS distribution packs for the next operational cycle.",
        "audience": "Ward offices",
        "stage": "AFTER PEAK",
        "priority": "Plan ahead",
        "status": "pending",
    },
    {
        "id": "act-11",
        "title": "Record observations",
        "description": "Log ward-level field observations and peak thermal stress impacts to refine local response.",
        "audience": "Field operations",
        "stage": "AFTER PEAK",
        "priority": "Plan ahead",
        "status": "pending",
    },
]


async def get_24h_heat_trend(
    location: str = "Pune",
    latitude: float | None = None,
    longitude: float | None = None,
) -> TrendsResponse:
    lat = latitude if latitude is not None else DEFAULT_LATITUDE
    lon = longitude if longitude is not None else DEFAULT_LONGITUDE

    try:
        forecast_res = await get_forecast(latitude=lat, longitude=lon, location=location)
    except WeatherServiceError as exc:
        raise IntelligenceServiceError("Unable to retrieve forecast data for heat trend") from exc

    if not forecast_res.hourly:
        return TrendsResponse(
            location=location,
            latitude=lat,
            longitude=lon,
            generated_at=datetime.now(UTC),
            points=[],
            peak_point=None,
        )

    today_date = datetime.now(UTC).date()
    today_hourly = [obs for obs in forecast_res.hourly if obs.observed_at.date() == today_date]
    if not today_hourly:
        today_hourly = forecast_res.hourly[:24]

    points: list[HourlyHeatPoint] = []
    max_score = -1
    peak_idx = -1

    for idx, obs in enumerate(today_hourly):
        try:
            w_obs = WeatherResponse(
                location=location,
                observed_at=obs.observed_at,
                conditions=obs,
                source="open-meteo",
            )
            t_inputs = thermal_inputs_from_weather(w_obs, latitude=lat, longitude=lon)
            t_stress = calculate_thermal_stress(t_inputs)
            h_score, h_level, _ = calculate_risk_assessment(w_obs, t_stress)

            formatted_time = format_pune_time(obs.observed_at)
            point = HourlyHeatPoint(
                time=obs.observed_at,
                formatted_time=formatted_time,
                temperature_c=obs.temperature_c,
                apparent_temperature_c=obs.apparent_temperature_c,
                humidity_percent=obs.humidity_percent,
                heat_index_c=t_stress.heat_index_c,
                estimated_wbgt_c=t_stress.estimated_wbgt_c,
                uv_index=obs.uv_index,
                risk_score=h_score,
                risk_level=h_level,
                is_peak=False,
            )
            points.append(point)
            if h_score > max_score:
                max_score = h_score
                peak_idx = len(points) - 1
        except (ThermalCalculationError, ValueError):
            continue

    peak_point: HourlyHeatPoint | None = None
    if peak_idx >= 0 and peak_idx < len(points):
        points[peak_idx].is_peak = True
        peak_point = points[peak_idx]

    return TrendsResponse(
        location=location,
        latitude=lat,
        longitude=lon,
        generated_at=datetime.now(UTC),
        points=points,
        peak_point=peak_point,
    )


async def get_heat_alerts() -> AlertsResponse:
    alerts: list[HeatAlert] = []

    for loc in PUNE_WARDS:

        try:
            trend = await get_24h_heat_trend(
                location=loc["name"],
                latitude=loc["latitude"],
                longitude=loc["longitude"],
            )
            peak = trend.peak_point
            if not peak:
                continue

            alert_id = f"alert-{loc['id']}"

            with _state_lock:
                status_override = _alert_status_store.get(alert_id, "active")

            rec_map: dict[RiskLevel, str] = {
                "Low": "Maintain standard routine preparedness and hydration checks.",
                "Moderate": "Prepare hydration resources and shaded rest areas prior to peak window.",
                "High": "Activate municipal cooling centers and issue targeted heat advisories.",
                "Severe": "Mobilize emergency heat response protocols and halt non-essential outdoor labor.",
            }

            created_time_str = f"Today, {format_pune_time(datetime.now(UTC))}"

            current_point = trend.points[0] if trend.points else peak
            current_risk_score = current_point.risk_score if current_point else peak.risk_score

            if peak.risk_score > current_risk_score + 10:
                alert_type = "early_warning"
            elif peak.risk_score > current_risk_score:
                alert_type = "forecast_warning"
            else:
                alert_type = "current_alert"

            alerts.append(
                HeatAlert(
                    id=alert_id,
                    alert_type=alert_type,  # type: ignore
                    severity=peak.risk_level,
                    ward=loc["name"],
                    ward_id=loc["id"],
                    risk_score=peak.risk_score,
                    current_risk_score=current_risk_score,
                    expected_peak_score=peak.risk_score,
                    expected_peak_time=peak.formatted_time,
                    created_at=created_time_str,
                    status=status_override,  # type: ignore
                    recommended_response=rec_map.get(peak.risk_level, "Prepare hydration and municipal response."),
                )
            )

        except Exception:
            continue

    active_count = sum(1 for a in alerts if a.status == "active")
    return AlertsResponse(alerts=alerts, active_count=active_count)


def update_alert_status(alert_id: str, new_status: str) -> None:
    if new_status not in ("active", "acknowledged", "resolved"):
        raise ValueError(f"Invalid alert status: {new_status}")
    with _state_lock:
        _alert_status_store[alert_id] = new_status


async def get_response_actions() -> ResponseActionsResponse:
    actions: list[ResponseActionItem] = []

    with _state_lock:
        for item in DEFAULT_ACTIONS:
            st = _action_status_store.get(item["id"], item["status"])
            actions.append(
                ResponseActionItem(
                    id=item["id"],
                    title=item["title"],
                    description=item["description"],
                    audience=item["audience"],
                    stage=item["stage"],
                    priority=item["priority"],
                    status=st,  # type: ignore
                )
            )

    pending_count = sum(1 for a in actions if a.status == "pending")
    completed_count = sum(1 for a in actions if a.status == "completed")

    return ResponseActionsResponse(
        actions=actions,
        pending_count=pending_count,
        completed_count=completed_count,
    )


def update_action_status(action_id: str, new_status: str) -> None:
    if new_status not in ("pending", "in_progress", "completed"):
        raise ValueError(f"Invalid action status: {new_status}")
    with _state_lock:
        _action_status_store[action_id] = new_status


async def get_municipal_summary() -> MunicipalResponseSummary:
    alerts_res = await get_heat_alerts()
    actions_res = await get_response_actions()

    # Count high risk wards (risk_score >= 25 or level != Low)
    high_risk_wards = sum(1 for a in alerts_res.alerts if a.risk_score >= 25 or a.severity in ("Moderate", "High", "Severe"))

    return MunicipalResponseSummary(
        active_alerts=alerts_res.active_count,
        high_risk_wards=high_risk_wards,
        actions_pending=actions_res.pending_count,
        actions_completed=actions_res.completed_count,
    )
