"""Scientifically documented thermal metrics; all WBGT outputs are estimates."""

from __future__ import annotations

from datetime import UTC, datetime
import math

from models.thermal import ThermalContext, ThermalInputs, ThermalMethodology, ThermalStressResponse
from models.weather import WeatherResponse
from services.weather_service import get_current_weather

STEFAN_BOLTZMANN = 5.67e-8
RADIATIVE_COEFFICIENT = 5.3865e-8


class ThermalCalculationError(ValueError):
    """Raised when required thermal inputs are absent or physically invalid."""


def build_thermal_context(
    air_temperature_c: float, relative_humidity_percent: int, wind_speed_kph: float
) -> ThermalContext:
    """Retain the existing risk-service integration without performing a risk calculation."""
    return ThermalContext(
        air_temperature_c=air_temperature_c,
        relative_humidity_percent=relative_humidity_percent,
        wind_speed_kph=wind_speed_kph,
        source="weather data",
    )


async def calculate_current_thermal_stress(
    *, latitude: float, longitude: float, location: str
) -> ThermalStressResponse:
    weather = await get_current_weather(
        latitude=latitude,
        longitude=longitude,
        location=location,
    )
    inputs = thermal_inputs_from_weather(weather, latitude=latitude, longitude=longitude)
    return calculate_thermal_stress(inputs)


def thermal_inputs_from_weather(
    weather: WeatherResponse, *, latitude: float, longitude: float
) -> ThermalInputs:
    conditions = weather.conditions
    required_values = {
        "air temperature": conditions.temperature_c,
        "relative humidity": conditions.humidity_percent,
        "wind speed": conditions.wind_speed_kph,
        "surface pressure": conditions.surface_pressure_hpa,
        "solar radiation": conditions.solar_radiation_w_m2,
        "direct radiation": conditions.direct_radiation_w_m2,
        "diffuse radiation": conditions.diffuse_radiation_w_m2,
    }
    missing = [name for name, value in required_values.items() if value is None]
    if missing:
        raise ThermalCalculationError(f"Missing weather values: {', '.join(missing)}")
    return ThermalInputs(
        air_temperature_c=conditions.temperature_c,
        relative_humidity_percent=conditions.humidity_percent,
        wind_speed_kph=conditions.wind_speed_kph,
        surface_pressure_hpa=conditions.surface_pressure_hpa,
        solar_radiation_w_m2=conditions.solar_radiation_w_m2,
        direct_radiation_w_m2=conditions.direct_radiation_w_m2,
        diffuse_radiation_w_m2=conditions.diffuse_radiation_w_m2,
        dew_point_c=conditions.dew_point_c,
        observed_at=weather.observed_at,
        latitude=latitude,
        longitude=longitude,
    )


def calculate_heat_index(temperature_c: float, relative_humidity_percent: float) -> tuple[float, str]:
    """Calculate NWS Heat Index using the simple or Rothfusz branch in °C."""
    _validate_temperature_and_humidity(temperature_c, relative_humidity_percent)
    temperature_f = _celsius_to_fahrenheit(temperature_c)
    simple_f = 0.5 * (
        temperature_f + 61.0 + ((temperature_f - 68.0) * 1.2) + (relative_humidity_percent * 0.094)
    )
    simple_f = (simple_f + temperature_f) / 2
    if simple_f < 80.0:
        return _fahrenheit_to_celsius(simple_f), "simple"

    heat_index_f = (
        -42.379 + 2.04901523 * temperature_f + 10.14333127 * relative_humidity_percent
        - 0.22475541 * temperature_f * relative_humidity_percent
        - 0.00683783 * temperature_f**2 - 0.05481717 * relative_humidity_percent**2
        + 0.00122874 * temperature_f**2 * relative_humidity_percent
        + 0.00085282 * temperature_f * relative_humidity_percent**2
        - 0.00000199 * temperature_f**2 * relative_humidity_percent**2
    )
    if relative_humidity_percent < 13 and 80 <= temperature_f <= 112:
        heat_index_f -= ((13 - relative_humidity_percent) / 4) * math.sqrt((17 - abs(temperature_f - 95)) / 17)
    elif relative_humidity_percent > 85 and 80 <= temperature_f <= 87:
        heat_index_f += ((relative_humidity_percent - 85) / 10) * ((87 - temperature_f) / 5)
    return _fahrenheit_to_celsius(heat_index_f), "rothfusz"


def estimate_natural_wet_bulb_temperature(
    air_temperature_c: float, relative_humidity_percent: float
) -> float:
    """Use the wet-bulb approximation cited in the Dimiceli–Piltz NWS paper."""
    _validate_temperature_and_humidity(air_temperature_c, relative_humidity_percent)
    temperature = air_temperature_c
    humidity = relative_humidity_percent
    wet_bulb_c = (
        -5.806 + 0.672 * temperature - 0.006 * temperature**2
        + (0.061 + 0.004 * temperature + 99e-6 * temperature**2) * humidity
        + (-33e-6 - 5e-6 * temperature - 1e-7 * temperature**2) * humidity**2
    )
    _validate_finite("natural wet-bulb temperature", wet_bulb_c)
    return wet_bulb_c


def estimate_globe_temperature(inputs: ThermalInputs) -> float:
    """Implement the NWS/Dimiceli–Piltz Eq. (10) globe-temperature estimate in °C."""
    _validate_thermal_inputs(inputs)
    timestamp = _as_utc(inputs.observed_at)
    air_temperature_k = inputs.air_temperature_c + 273.15
    wind_speed_m_per_hour = inputs.wind_speed_kph * 1000
    atmospheric_emissivity = 0.575 * _vapour_pressure_hpa(inputs) ** (1 / 7)
    cosine_zenith = _cosine_solar_zenith(timestamp, inputs.latitude, inputs.longitude)

    if cosine_zenith <= 0 or inputs.solar_radiation_w_m2 == 0:
        solar_term = 0.0
    else:
        direct_fraction = inputs.direct_radiation_w_m2 / inputs.solar_radiation_w_m2
        diffuse_fraction = inputs.diffuse_radiation_w_m2 / inputs.solar_radiation_w_m2
        solar_term = inputs.solar_radiation_w_m2 * (
            direct_fraction / (4 * STEFAN_BOLTZMANN * cosine_zenith)
            + (1.2 / STEFAN_BOLTZMANN) * diffuse_fraction
        )

    coefficient_c = 0.315 * wind_speed_m_per_hour**0.58 / RADIATIVE_COEFFICIENT
    coefficient_b = solar_term + atmospheric_emissivity * air_temperature_k**4
    globe_temperature_k = (
        coefficient_b + coefficient_c * air_temperature_k + 7_680_000
    ) / (coefficient_c + 256_000)
    _validate_finite("estimated globe temperature", globe_temperature_k)
    if globe_temperature_k <= 0:
        raise ThermalCalculationError("Estimated globe temperature is below absolute zero")
    return globe_temperature_k - 273.15


def calculate_thermal_stress(inputs: ThermalInputs) -> ThermalStressResponse:
    """Return explainable, non-clinical thermal metrics without a municipal risk score."""
    heat_index_c, heat_index_method = calculate_heat_index(
        inputs.air_temperature_c, inputs.relative_humidity_percent
    )
    natural_wet_bulb_c = estimate_natural_wet_bulb_temperature(
        inputs.air_temperature_c, inputs.relative_humidity_percent
    )
    globe_temperature_c = estimate_globe_temperature(inputs)
    estimated_wbgt_c = (
        0.7 * natural_wet_bulb_c + 0.2 * globe_temperature_c + 0.1 * inputs.air_temperature_c
    )
    _validate_finite("estimated WBGT", estimated_wbgt_c)
    level = _heat_index_level(_celsius_to_fahrenheit(heat_index_c))
    return ThermalStressResponse(
        heat_index_c=round(heat_index_c, 1),
        heat_index_method=heat_index_method,
        estimated_wbgt_c=round(estimated_wbgt_c, 1),
        natural_wet_bulb_temperature_c=round(natural_wet_bulb_c, 1),
        estimated_globe_temperature_c=round(globe_temperature_c, 1),
        thermal_stress_level=level,
        thermal_stress_factors=_stress_factors(inputs, heat_index_c, estimated_wbgt_c),
        methodology=ThermalMethodology(
            heat_index=(
                "NOAA/NWS Heat Index: simple calculation first; Rothfusz regression and documented humidity adjustments when the preliminary result is at least 80°F."
            ),
            wbgt=(
                "Estimated outdoor WBGT: 0.7 × estimated natural wet-bulb + 0.2 × estimated black-globe temperature + 0.1 × air temperature. "
                "Black-globe temperature uses the NWS/Dimiceli–Piltz published Eq. (10)."
            ),
            limitations=[
                "estimated_wbgt_c is not measured WBGT and must not be used as a sensor substitute.",
                "The NWS globe estimate is sensitive to wind and radiation inputs.",
                "Grid-point weather cannot resolve local shade, surfaces, clothing, activity, or urban-canyon conditions.",
                "Thermal stress level uses named NWS Heat Index bands; it is not a clinical, mortality, or municipal impact prediction.",
            ],
        ),
    )


def _vapour_pressure_hpa(inputs: ThermalInputs) -> float:
    dew_point_c = inputs.dew_point_c if inputs.dew_point_c is not None else _dew_point_c(inputs.air_temperature_c, inputs.relative_humidity_percent)
    vapour_pressure_hpa = (
        math.exp(17.67 * (dew_point_c - inputs.air_temperature_c) / (dew_point_c + 243.5))
        * (1.0007 + 0.00000346 * inputs.surface_pressure_hpa)
        * 6.112 * math.exp(17.502 * inputs.air_temperature_c / (240.97 + inputs.air_temperature_c))
    )
    _validate_finite("atmospheric vapour pressure", vapour_pressure_hpa)
    if vapour_pressure_hpa <= 0:
        raise ThermalCalculationError("Atmospheric vapour pressure must be positive")
    return vapour_pressure_hpa


def _dew_point_c(air_temperature_c: float, relative_humidity_percent: float) -> float:
    """Magnus dew-point relation (Alduchov and Eskridge constants) when provider value is absent."""
    if relative_humidity_percent == 0:
        raise ThermalCalculationError("Dew point cannot be derived at 0% relative humidity")
    gamma = math.log(relative_humidity_percent / 100) + (17.625 * air_temperature_c) / (243.04 + air_temperature_c)
    return 243.04 * gamma / (17.625 - gamma)


def _cosine_solar_zenith(timestamp: datetime, latitude: float, longitude: float) -> float:
    """NOAA solar-position approximation; returns cos(zenith) without a nighttime division."""
    utc_timestamp = _as_utc(timestamp)
    day_of_year = utc_timestamp.timetuple().tm_yday
    hour = utc_timestamp.hour + utc_timestamp.minute / 60 + utc_timestamp.second / 3600
    gamma = 2 * math.pi / 365 * (day_of_year - 1 + (hour - 12) / 24)
    equation_of_time = 229.18 * (
        0.000075 + 0.001868 * math.cos(gamma) - 0.032077 * math.sin(gamma)
        - 0.014615 * math.cos(2 * gamma) - 0.040849 * math.sin(2 * gamma)
    )
    declination = (
        0.006918 - 0.399912 * math.cos(gamma) + 0.070257 * math.sin(gamma)
        - 0.006758 * math.cos(2 * gamma) + 0.000907 * math.sin(2 * gamma)
        - 0.002697 * math.cos(3 * gamma) + 0.00148 * math.sin(3 * gamma)
    )
    true_solar_minutes = (hour * 60 + equation_of_time + 4 * longitude) % 1440
    hour_angle = math.radians(true_solar_minutes / 4 - 180)
    latitude_radians = math.radians(latitude)
    return (
        math.sin(latitude_radians) * math.sin(declination)
        + math.cos(latitude_radians) * math.cos(declination) * math.cos(hour_angle)
    )


def _heat_index_level(heat_index_f: float) -> str:
    if heat_index_f >= 125:
        return "extreme_danger"
    if heat_index_f >= 103:
        return "danger"
    if heat_index_f >= 90:
        return "extreme_caution"
    if heat_index_f >= 80:
        return "caution"
    return "normal"


def _stress_factors(inputs: ThermalInputs, heat_index_c: float, estimated_wbgt_c: float) -> list[str]:
    return [
        f"Air temperature: {inputs.air_temperature_c:.1f}°C.",
        f"Relative humidity: {inputs.relative_humidity_percent:.0f}% (an input to the NWS Heat Index).",
        f"NWS Heat Index: {heat_index_c:.1f}°C.",
        f"Solar radiation: {inputs.solar_radiation_w_m2:.0f} W/m² (included in the black-globe estimate).",
        f"Wind speed: {inputs.wind_speed_kph:.1f} km/h (included in the black-globe estimate).",
        f"Estimated outdoor WBGT: {estimated_wbgt_c:.1f}°C; this is not a measured sensor value.",
    ]


def _validate_temperature_and_humidity(temperature_c: float, humidity_percent: float) -> None:
    _validate_finite("air temperature", temperature_c)
    _validate_finite("relative humidity", humidity_percent)
    if not -90 <= temperature_c <= 70:
        raise ThermalCalculationError("Air temperature must be between -90°C and 70°C")
    if not 0 <= humidity_percent <= 100:
        raise ThermalCalculationError("Relative humidity must be between 0 and 100%")


def _validate_thermal_inputs(inputs: ThermalInputs) -> None:
    _validate_temperature_and_humidity(inputs.air_temperature_c, inputs.relative_humidity_percent)
    for name, value in (
        ("wind speed", inputs.wind_speed_kph), ("surface pressure", inputs.surface_pressure_hpa),
        ("solar radiation", inputs.solar_radiation_w_m2), ("direct radiation", inputs.direct_radiation_w_m2),
        ("diffuse radiation", inputs.diffuse_radiation_w_m2),
    ):
        _validate_finite(name, value)
        if value < 0:
            raise ThermalCalculationError(f"{name.capitalize()} cannot be negative")


def _validate_finite(name: str, value: float) -> None:
    if not math.isfinite(value):
        raise ThermalCalculationError(f"{name.capitalize()} must be finite")


def _as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


def _celsius_to_fahrenheit(value: float) -> float:
    return value * 9 / 5 + 32


def _fahrenheit_to_celsius(value: float) -> float:
    return (value - 32) * 5 / 9
