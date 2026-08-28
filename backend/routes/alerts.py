from datetime import UTC, datetime

from fastapi import APIRouter, Query

from models.alerts import AlertsResponse, HeatAlert
from services.risk_service import RiskServiceError, get_risk_summary

router = APIRouter(prefix="/api", tags=["Alerts"])


@router.get("/alerts", response_model=AlertsResponse)
async def read_alerts(location: str = Query(default="Pune", min_length=1, max_length=80)) -> AlertsResponse:
    """Derive active citizen alerts from the same live risk engine used by Home."""
    try:
        risk = await get_risk_summary(location)
    except RiskServiceError:
        # Keep the API contract valid when the upstream weather service is unavailable.
        return AlertsResponse(alerts=[], active_count=0)

    if risk.level not in {"high", "severe"}:
        return AlertsResponse(alerts=[], active_count=0)

    if risk.level == "severe":
        alert_type = "Extreme Heat Warning"
        response = "Avoid prolonged outdoor activity, stay hydrated, and remain in a cool place during peak heat."
    else:
        alert_type = "High Heat Advisory"
        response = "Limit prolonged outdoor activity, drink water regularly, and avoid peak afternoon heat."

    peak_score = risk.peak_window.risk_score if risk.peak_window else risk.score
    peak_time = risk.peak_window.formatted_time if risk.peak_window else "Peak period unavailable"
    alert = HeatAlert(
        id=f"risk-{location.lower().replace(' ', '-')}-{risk.assessed_at.strftime('%Y%m%d%H%M')}",
        alert_type=alert_type,
        severity=risk.level,
        ward=location,
        risk_score=risk.score,
        current_risk_score=risk.score,
        expected_peak_score=peak_score,
        expected_peak_time=peak_time,
        created_at=datetime.now(UTC),
        status="active",
        recommended_response=response,
    )
    return AlertsResponse(alerts=[alert], active_count=1)
