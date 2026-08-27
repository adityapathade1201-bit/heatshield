from fastapi import APIRouter, HTTPException, Query

from models.weather import WeatherResponse
from services.weather_service import DEFAULT_LATITUDE, DEFAULT_LONGITUDE, WeatherServiceError, get_current_weather

router = APIRouter(prefix="/api", tags=["Weather"])


@router.get("/weather", response_model=WeatherResponse)
async def read_weather(
    latitude: float = Query(default=DEFAULT_LATITUDE, ge=-90, le=90),
    longitude: float = Query(default=DEFAULT_LONGITUDE, ge=-180, le=180),
    location: str = Query(default="Pune", min_length=1, max_length=80),
) -> WeatherResponse:
    try:
        return await get_current_weather(latitude=latitude, longitude=longitude, location=location)
    except WeatherServiceError as exc:
        raise HTTPException(status_code=503, detail="Weather data is unavailable.") from exc
