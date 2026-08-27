from fastapi import APIRouter, HTTPException, Query

from models.thermal import ThermalStressResponse
from services.thermal_service import ThermalCalculationError, calculate_current_thermal_stress
from services.weather_service import DEFAULT_LATITUDE, DEFAULT_LONGITUDE, WeatherServiceError

router = APIRouter(prefix="/api", tags=["Thermal"])


@router.get("/thermal", response_model=ThermalStressResponse)
async def read_thermal(
    latitude: float = Query(default=DEFAULT_LATITUDE, ge=-90, le=90),
    longitude: float = Query(default=DEFAULT_LONGITUDE, ge=-180, le=180),
    location: str = Query(default="Pune", min_length=1, max_length=80),
) -> ThermalStressResponse:
    try:
        return await calculate_current_thermal_stress(
            latitude=latitude,
            longitude=longitude,
            location=location,
        )
    except (ThermalCalculationError, WeatherServiceError) as exc:
        raise HTTPException(status_code=503, detail="Thermal data is unavailable.") from exc