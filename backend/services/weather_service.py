"""Open-Meteo provider adapter for normalized HeatWatch weather data."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from zoneinfo import ZoneInfo

import httpx

from models.weather import (
    ForecastDay,
    ForecastPeakConditions,
    ForecastResponse,
    HourlyWeatherObservation,
    WeatherConditions,
    WeatherResponse,
)

PUNE_TIMEZONE = ZoneInfo("Asia/Kolkata")


def format_pune_time(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    local_dt = dt.astimezone(PUNE_TIMEZONE)
    return local_dt.strftime("%I:%M %p").lstrip("0")


DEFAULT_LATITUDE = 18.5204

DEFAULT_LONGITUDE = 73.8567
OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
REQUEST_TIMEOUT_SECONDS = 10.0

WEATHER_CONDITIONS: dict[int, str] = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Moderate drizzle",
    55: "Dense drizzle", 61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow", 80: "Rain showers",
    81: "Moderate rain showers", 82: "Violent rain showers", 95: "Thunderstorm",
    96: "Thunderstorm with hail", 99: "Thunderstorm with heavy hail",
}


class WeatherServiceError(Exception):
    """Raised when Open-Meteo cannot provide a valid weather response."""


class WeatherService:
    """Keeps Open-Meteo HTTP and response-shape details out of API routes."""

    def __init__(self, transport: httpx.AsyncBaseTransport | None = None) -> None:
        self._transport = transport

    async def get_current_weather(
        self, *, latitude: float, longitude: float, location: str
    ) -> WeatherResponse:
        payload = await self._fetch(latitude, longitude)
        try:
            current = payload["current"]
            return WeatherResponse(
                location=location,
                observed_at=self._parse_timestamp(current["time"]),
                conditions=WeatherConditions(
                    **self._normalise_conditions(current),
                ),
                source="open-meteo",
            )
        except (KeyError, TypeError, ValueError) as exc:
            raise WeatherServiceError("Open-Meteo returned an unexpected current-weather payload") from exc

    async def get_forecast(
        self, *, latitude: float, longitude: float, location: str
    ) -> ForecastResponse:
        payload = await self._fetch(latitude, longitude)
        try:
            daily = payload["daily"]
            hourly = payload["hourly"]
            hourly_observations = self._normalise_hourly(hourly)
            from services.risk_service import calculate_risk_assessment
            from services.thermal_service import ThermalCalculationError, calculate_thermal_stress, thermal_inputs_from_weather

            days: list[ForecastDay] = []
            for day, code, high, low in zip(
                daily["time"], daily["weather_code"], daily["temperature_2m_max"],
                daily["temperature_2m_min"], strict=True
            ):
                day_date = datetime.fromisoformat(day).date()
                day_hourly = [obs for obs in hourly_observations if obs.observed_at.date() == day_date]
                max_score = -1
                max_level = "low"
                has_valid_risk = False
                best_obs = None
                best_stress = None

                for obs in day_hourly:
                    try:
                        weather_obs = WeatherResponse(
                            location=location,
                            observed_at=obs.observed_at,
                            conditions=obs,
                            source="open-meteo",
                        )
                        t_inputs = thermal_inputs_from_weather(weather_obs, latitude=latitude, longitude=longitude)
                        t_stress = calculate_thermal_stress(t_inputs)
                        score, level, _ = calculate_risk_assessment(weather_obs, t_stress)
                        if score > max_score:
                            max_score = score
                            max_level = level
                            best_obs = obs
                            best_stress = t_stress
                        has_valid_risk = True
                    except (ThermalCalculationError, ValueError):
                        continue

                peak_conditions: ForecastPeakConditions | None = None
                peak_time: datetime | None = None
                peak_time_local: str | None = None

                if best_obs and best_stress:
                    peak_time = best_obs.observed_at
                    peak_time_local = format_pune_time(best_obs.observed_at)
                    peak_conditions = ForecastPeakConditions(
                        temperature_c=best_obs.temperature_c,
                        apparent_temperature_c=best_obs.apparent_temperature_c,
                        humidity_percent=best_obs.humidity_percent,
                        wind_speed_kph=best_obs.wind_speed_kph,
                        solar_radiation_w_m2=best_obs.solar_radiation_w_m2,
                        uv_index=best_obs.uv_index,
                        heat_index_c=best_stress.heat_index_c,
                        estimated_wbgt_c=best_stress.estimated_wbgt_c,
                    )

                days.append(
                    ForecastDay(
                        date=day_date,
                        weather_code=code,
                        condition=self._weather_description(code),
                        high_c=high,
                        low_c=low,
                        risk_level=max_level if has_valid_risk and max_score >= 0 else None,
                        risk_score=max_score if has_valid_risk and max_score >= 0 else None,
                        peak_time=peak_time,
                        peak_time_local=peak_time_local,
                        peak_conditions=peak_conditions,
                    )
                )


            if len(days) != 5:
                raise ValueError("Expected five forecast days")
            return ForecastResponse(
                location=location,
                generated_at=datetime.now(UTC),
                days=days,
                hourly=hourly_observations,
                source="open-meteo",
            )
        except (KeyError, TypeError, ValueError) as exc:
            raise WeatherServiceError("Open-Meteo returned an unexpected forecast payload") from exc


    async def _fetch(self, latitude: float, longitude: float) -> dict[str, Any]:
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure,dew_point_2m,wet_bulb_temperature_2m,shortwave_radiation,direct_radiation,diffuse_radiation,cloud_cover,uv_index,apparent_temperature,weather_code",
            "hourly": "temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure,dew_point_2m,wet_bulb_temperature_2m,shortwave_radiation,direct_radiation,diffuse_radiation,cloud_cover,uv_index,apparent_temperature,weather_code",
            "daily": "weather_code,temperature_2m_max,temperature_2m_min",
            "forecast_days": 5,
            "timezone": "UTC",
        }

        try:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS, transport=self._transport) as client:
                response = await client.get(OPEN_METEO_FORECAST_URL, params=params)
                response.raise_for_status()
                payload = response.json()
        except httpx.TimeoutException as exc:
            raise WeatherServiceError("Open-Meteo request timed out") from exc
        except httpx.HTTPError as exc:
            raise WeatherServiceError("Open-Meteo request failed") from exc
        except ValueError as exc:
            raise WeatherServiceError("Open-Meteo returned invalid JSON") from exc
        if not isinstance(payload, dict):
            raise WeatherServiceError("Open-Meteo returned an invalid payload")
        return payload

    @staticmethod
    def _parse_timestamp(value: str) -> datetime:
        parsed = datetime.fromisoformat(value)
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)

    @staticmethod
    def _weather_description(code: int) -> str:
        return WEATHER_CONDITIONS.get(code, "Unknown conditions")

    def _normalise_hourly(self, hourly: dict[str, list[Any]]) -> list[HourlyWeatherObservation]:
        fields = (
            "time", "temperature_2m", "relative_humidity_2m", "wind_speed_10m", "surface_pressure", "dew_point_2m",
            "wet_bulb_temperature_2m", "shortwave_radiation", "direct_radiation", "diffuse_radiation", "cloud_cover", "uv_index",
            "apparent_temperature", "weather_code",
        )
        series = [hourly[field] for field in fields]
        return [
            HourlyWeatherObservation(
                observed_at=self._parse_timestamp(timestamp),
                **self._normalise_conditions(dict(zip(fields[1:], values, strict=True))),
            )
            for timestamp, *values in zip(*series, strict=True)
        ]

    def _normalise_conditions(self, values: dict[str, Any]) -> dict[str, Any]:
        weather_code = values.get("weather_code")
        return {
            "temperature_c": values.get("temperature_2m"),
            "apparent_temperature_c": values.get("apparent_temperature"),
            "humidity_percent": values.get("relative_humidity_2m"),
            "wind_speed_kph": values.get("wind_speed_10m"),
            "surface_pressure_hpa": values.get("surface_pressure"),
            "dew_point_c": values.get("dew_point_2m"),
            "wet_bulb_temperature_c": values.get("wet_bulb_temperature_2m"),
            "solar_radiation_w_m2": values.get("shortwave_radiation"),
            "direct_radiation_w_m2": values.get("direct_radiation"),
            "diffuse_radiation_w_m2": values.get("diffuse_radiation"),
            "cloud_cover_percent": values.get("cloud_cover"),
            "uv_index": values.get("uv_index"),
            "weather_code": weather_code,
            "condition": self._weather_description(weather_code) if weather_code is not None else "Unknown conditions",
        }


weather_service = WeatherService()


async def get_current_weather(*, latitude: float, longitude: float, location: str) -> WeatherResponse:
    return await weather_service.get_current_weather(latitude=latitude, longitude=longitude, location=location)


async def get_forecast(*, latitude: float, longitude: float, location: str) -> ForecastResponse:
    return await weather_service.get_forecast(latitude=latitude, longitude=longitude, location=location)
