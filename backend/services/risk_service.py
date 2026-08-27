"""Deterministic heat-risk scoring from live weather and thermal outputs."""

from datetime import UTC, datetime

from models.risk import LocationRisk, LocationsResponse, PeakHeatWindow, RiskDriver, RiskLevel, RiskResponse
from models.thermal import ThermalStressResponse
from models.weather import WeatherResponse
from services.thermal_service import (
    ThermalCalculationError,
    calculate_thermal_stress,
    thermal_inputs_from_weather,
)
from services.weather_service import (
    DEFAULT_LATITUDE,
    DEFAULT_LONGITUDE,
    WeatherServiceError,
    format_pune_time,
    get_current_weather,
    get_forecast,
)



class RiskServiceError(Exception):
    """Raised when risk information cannot be prepared."""


async def get_risk_summary(
    location: str,
    latitude: float | None = None,
    longitude: float | None = None,
) -> RiskResponse:
    lat = latitude if latitude is not None else DEFAULT_LATITUDE
    lon = longitude if longitude is not None else DEFAULT_LONGITUDE
    try:
        weather = await get_current_weather(
            latitude=lat,
            longitude=lon,
            location=location,
        )
        thermal = calculate_thermal_stress(
            thermal_inputs_from_weather(
                weather, latitude=lat, longitude=lon
            )
        )
    except (WeatherServiceError, ThermalCalculationError) as exc:
        raise RiskServiceError("Weather or thermal data dependency failed") from exc

    score, level, drivers = calculate_risk_assessment(weather, thermal)

    peak_window: PeakHeatWindow | None = None
    try:
        forecast_res = await get_forecast(latitude=lat, longitude=lon, location=location)
        today_date = weather.observed_at.date()
        today_hourly = [obs for obs in forecast_res.hourly if obs.observed_at.date() == today_date]
        if not today_hourly and forecast_res.hourly:
            today_hourly = forecast_res.hourly[:24]

        max_p_score = -1
        best_p_obs = None
        best_p_stress = None
        best_p_level: RiskLevel = "low"

        for obs in today_hourly:
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
                if h_score > max_p_score:
                    max_p_score = h_score
                    best_p_obs = obs
                    best_p_stress = t_stress
                    best_p_level = h_level
            except (ThermalCalculationError, ValueError):
                continue

        if best_p_obs and best_p_stress and max_p_score >= 0:
            formatted = format_pune_time(best_p_obs.observed_at)
            peak_window = PeakHeatWindow(


                time=best_p_obs.observed_at,
                formatted_time=formatted,
                risk_score=max_p_score,
                risk_level=best_p_level,
                temperature_c=best_p_obs.temperature_c,
                apparent_temperature_c=best_p_obs.apparent_temperature_c,
                humidity_percent=best_p_obs.humidity_percent,
                uv_index=best_p_obs.uv_index,
                estimated_wbgt_c=best_p_stress.estimated_wbgt_c,
            )
    except (WeatherServiceError, ThermalCalculationError, ValueError):
        peak_window = None

    return RiskResponse(
        location=weather.location,
        assessed_at=datetime.now(UTC),
        level=level,
        score=score,
        drivers=drivers,
        source="open-meteo+thermal",
        peak_window=peak_window,
    )




def calculate_risk_assessment(
    weather: WeatherResponse, thermal: ThermalStressResponse
) -> tuple[int, RiskLevel, list[RiskDriver]]:
    """Score current exposure with fixed threshold points; maximum score is 100."""
    conditions = weather.conditions
    contributions = (
        ("Estimated WBGT", thermal.estimated_wbgt_c, ((26, 10), (28, 20), (30, 30), (32, 40)), f"Estimated outdoor WBGT is {thermal.estimated_wbgt_c:.1f}°C (40-point component)."),
        ("Heat Index", thermal.heat_index_c, ((27, 5), (32, 12), (39, 20), (46, 25)), f"NWS Heat Index is {thermal.heat_index_c:.1f}°C (25-point component)."),
        ("Air temperature", conditions.temperature_c, ((30, 3), (35, 7), (40, 10)), f"Air temperature is {conditions.temperature_c}°C (10-point component)."),
        ("Apparent temperature", conditions.apparent_temperature_c, ((30, 2), (35, 5), (40, 8)), f"Apparent temperature is {conditions.apparent_temperature_c}°C (8-point component)."),
        ("Relative humidity", conditions.humidity_percent, ((50, 1), (60, 3), (75, 5)), f"Relative humidity is {conditions.humidity_percent}% (5-point component)."),
        ("Solar radiation", conditions.solar_radiation_w_m2, ((200, 1), (500, 2), (800, 4)), f"Solar radiation is {conditions.solar_radiation_w_m2} W/m² (4-point component)."),
        ("UV index", conditions.uv_index, ((3, 1), (6, 2), (8, 4)), f"UV index is {conditions.uv_index} (4-point component)."),
    )
    score = 0
    drivers: list[RiskDriver] = []
    for name, value, thresholds, description in contributions:
        points = _threshold_points(value, thresholds)
        score += points
        if points:
            drivers.append(RiskDriver(
                name=name,
                value=_format_value(name, value),
                description=f"{description} Awarded {points} points.",
            ))

    wind_points = _low_wind_points(conditions.wind_speed_kph)
    score += wind_points
    if wind_points:
        drivers.append(RiskDriver(
            name="Wind speed",
            value=f"{conditions.wind_speed_kph} km/h",
            description=f"Low wind adds {wind_points} points because it reduces convective cooling.",
        ))
    if not drivers:
        drivers.append(RiskDriver(
            name="Current conditions",
            value="Low contribution",
            description="All available weather and thermal inputs are below scoring thresholds.",
        ))
    bounded_score = max(0, min(100, round(score)))
    return bounded_score, _risk_level(bounded_score), drivers


def _threshold_points(value: float | None, thresholds: tuple[tuple[float, int], ...]) -> int:
    if value is None:
        return 0
    return max((points for threshold, points in thresholds if value >= threshold), default=0)


def _low_wind_points(value: float | None) -> int:
    if value is None:
        return 0
    if value <= 5:
        return 4
    if value <= 10:
        return 3
    if value <= 20:
        return 1
    return 0


def _format_value(name: str, value: float | None) -> str:
    if value is None:
        return "Unavailable"
    if name == "Relative humidity":
        return f"{value:.0f}%"
    if name == "UV index":
        return f"{value:.0f}"
    if name == "Solar radiation":
        return f"{value:.0f} W/m²"
    return f"{value:.1f}°C"


def _risk_level(score: int) -> RiskLevel:
    if score >= 75:
        return "severe"
    if score >= 50:
        return "high"
    if score >= 25:
        return "moderate"
    return "low"


PUNE_WARDS = [
    {"id": "shivajinagar", "name": "Shivajinagar", "ward": "Ward 5", "latitude": 18.5308, "longitude": 73.8475},
    {"id": "yerawada", "name": "Yerawada", "ward": "Ward 12", "latitude": 18.5530, "longitude": 73.8765},
    {"id": "kothrud", "name": "Kothrud", "ward": "Ward 34", "latitude": 18.5074, "longitude": 73.8077},
    {"id": "hadapsar", "name": "Hadapsar", "ward": "Ward 21", "latitude": 18.5089, "longitude": 73.9260},
]


async def get_locations() -> LocationsResponse:
    locations: list[LocationRisk] = []
    for meta in PUNE_WARDS:

        try:
            risk_res = await get_risk_summary(
                location=meta["name"],
                latitude=meta["latitude"],
                longitude=meta["longitude"],
            )
            score, level = risk_res.score, risk_res.level
        except RiskServiceError:
            score, level = 0, "low"

        locations.append(
            LocationRisk(
                id=meta["id"],
                name=meta["name"],
                ward=meta["ward"],
                latitude=meta["latitude"],
                longitude=meta["longitude"],
                risk_level=level,
                risk_score=score,
            )
        )

    return LocationsResponse(
        locations=locations,
        source="open-meteo+thermal",
    )


