from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

from models.risk import RiskLevel

DataSource = Literal["mock", "open-meteo"]



class WeatherConditions(BaseModel):
    temperature_c: float | None = Field(default=None, description="Air temperature in degrees Celsius")
    apparent_temperature_c: float | None = Field(default=None, description="Apparent temperature in degrees Celsius")
    humidity_percent: int | None = Field(default=None, ge=0, le=100)
    wind_speed_kph: float | None = Field(default=None, ge=0)
    surface_pressure_hpa: float | None = Field(default=None, gt=0)
    dew_point_c: float | None = Field(default=None, description="Dew-point temperature in degrees Celsius")
    wet_bulb_temperature_c: float | None = Field(default=None, description="Wet-bulb temperature at 2 m in degrees Celsius")
    solar_radiation_w_m2: float | None = Field(default=None, ge=0, description="Shortwave solar radiation in W/m²")
    direct_radiation_w_m2: float | None = Field(default=None, ge=0, description="Direct shortwave radiation in W/m²")
    diffuse_radiation_w_m2: float | None = Field(default=None, ge=0, description="Diffuse shortwave radiation in W/m²")
    cloud_cover_percent: int | None = Field(default=None, ge=0, le=100)
    uv_index: float | None = Field(default=None, ge=0)
    weather_code: int | None = Field(default=None, ge=0, description="WMO weather interpretation code")
    condition: str


class HourlyWeatherObservation(WeatherConditions):
    observed_at: datetime


class WeatherResponse(BaseModel):
    location: str
    observed_at: datetime
    conditions: WeatherConditions
    source: DataSource


class ForecastPeakConditions(BaseModel):
    temperature_c: float | None = None
    apparent_temperature_c: float | None = None
    humidity_percent: int | None = None
    wind_speed_kph: float | None = None
    solar_radiation_w_m2: float | None = None
    uv_index: float | None = None
    heat_index_c: float | None = None
    estimated_wbgt_c: float | None = None


class ForecastDay(BaseModel):
    date: date
    condition: str
    weather_code: int = Field(ge=0, description="WMO weather interpretation code")
    high_c: float
    low_c: float
    risk_level: RiskLevel | None = None
    risk_score: int | None = Field(default=None, ge=0, le=100)
    peak_time: datetime | None = None
    peak_time_local: str | None = None
    peak_conditions: ForecastPeakConditions | None = None




class ForecastResponse(BaseModel):
    location: str
    generated_at: datetime
    days: list[ForecastDay]
    hourly: list[HourlyWeatherObservation]
    source: DataSource
