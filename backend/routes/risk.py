from fastapi import APIRouter, HTTPException, Query

from models.risk import LocationsResponse, RiskResponse
from services.risk_service import RiskServiceError, get_locations, get_risk_summary

router = APIRouter(prefix="/api", tags=["Risk"])


@router.get("/risk", response_model=RiskResponse)
async def read_risk(
    location: str = Query(default="Pune", min_length=1, max_length=80),
    latitude: float | None = Query(default=None, ge=-90, le=90),
    longitude: float | None = Query(default=None, ge=-180, le=180),
) -> RiskResponse:
    try:
        return await get_risk_summary(location, latitude=latitude, longitude=longitude)
    except RiskServiceError as exc:
        raise HTTPException(status_code=503, detail="Risk information is unavailable.") from exc



@router.get("/locations", response_model=LocationsResponse)
async def read_locations() -> LocationsResponse:
    try:
        return await get_locations()
    except RiskServiceError as exc:
        raise HTTPException(status_code=503, detail="Location information is unavailable.") from exc
