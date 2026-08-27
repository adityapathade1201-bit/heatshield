from fastapi import APIRouter, HTTPException, Query

from models.weather import ForecastResponse
from services.weather_service import DEFAULT_LATITUDE, DEFAULT_LONGITUDE, WeatherServiceError, get_forecast

router = APIRouter(prefix="/api", tags=["Forecast"])


@router.get("/forecast", response_model=ForecastResponse)
async def read_forecast(
    latitude: float = Query(default=DEFAULT_LATITUDE, ge=-90, le=90),
    longitude: float = Query(default=DEFAULT_LONGITUDE, ge=-180, le=180),
    location: str = Query(default="Pune", min_length=1, max_length=80),
) -> ForecastResponse:
    try:
        return await get_forecast(latitude=latitude, longitude=longitude, location=location)
    except WeatherServiceError as exc:
        raise HTTPException(status_code=503, detail="Forecast data is unavailable.") from exc
