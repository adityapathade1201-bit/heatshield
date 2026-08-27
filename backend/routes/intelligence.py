"""FastAPI routes for Phase 6 historical intelligence, early warnings, alerts, and response tracking."""

from fastapi import APIRouter, HTTPException, Query

from models.intelligence import (
    AlertsResponse,
    MunicipalResponseSummary,
    ResponseActionsResponse,
    StatusUpdatePayload,
    TrendsResponse,
)
from services.intelligence_service import (
    IntelligenceServiceError,
    get_24h_heat_trend,
    get_heat_alerts,
    get_municipal_summary,
    get_response_actions,
    update_action_status,
    update_alert_status,
)

router = APIRouter(prefix="/api", tags=["Intelligence"])


@router.get("/trends", response_model=TrendsResponse)
async def get_trends_endpoint(
    location: str = Query(default="Pune", description="Location name e.g. Pune or Ward name"),
    latitude: float | None = Query(default=None, description="Latitude coordinate"),
    longitude: float | None = Query(default=None, description="Longitude coordinate"),
) -> TrendsResponse:
    """Retrieve 24-hour hourly heat risk, temperature, and thermal trends."""
    try:
        return await get_24h_heat_trend(location=location, latitude=latitude, longitude=longitude)
    except IntelligenceServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/alerts", response_model=AlertsResponse)
async def get_alerts_endpoint() -> AlertsResponse:
    """Retrieve active and historical municipal heat alerts across monitored wards."""
    try:
        return await get_heat_alerts()
    except IntelligenceServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/alerts/{alert_id}/status")
async def update_alert_status_endpoint(
    alert_id: str,
    payload: StatusUpdatePayload,
) -> dict[str, str]:
    """Update municipal heat alert status (active, acknowledged, resolved)."""
    try:
        update_alert_status(alert_id=alert_id, new_status=payload.status)
        return {"status": "ok", "alert_id": alert_id, "new_status": payload.status}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/response-actions", response_model=ResponseActionsResponse)
async def get_response_actions_endpoint() -> ResponseActionsResponse:
    """Retrieve 3-stage operational response actions with current execution status."""
    try:
        return await get_response_actions()
    except IntelligenceServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/response-actions/{action_id}/status")
async def update_response_action_status_endpoint(
    action_id: str,
    payload: StatusUpdatePayload,
) -> dict[str, str]:
    """Update execution status of an operational response action (pending, in_progress, completed)."""
    try:
        update_action_status(action_id=action_id, new_status=payload.status)
        return {"status": "ok", "action_id": action_id, "new_status": payload.status}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/municipal-summary", response_model=MunicipalResponseSummary)
async def get_municipal_summary_endpoint() -> MunicipalResponseSummary:
    """Retrieve aggregated municipal heat-response status metrics."""
    try:
        return await get_municipal_summary()
    except IntelligenceServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
