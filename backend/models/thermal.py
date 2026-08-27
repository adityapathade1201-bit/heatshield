from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

HeatIndexMethod = Literal["simple", "rothfusz"]
ThermalStressLevel = Literal["normal", "caution", "extreme_caution", "danger", "extreme_danger"]


class ThermalInputs(BaseModel):
    """Normalized meteorological inputs used by the thermal engine."""

    air_temperature_c: float = Field(ge=-90, le=70)
    relative_humidity_percent: float = Field(ge=0, le=100)
    wind_speed_kph: float = Field(ge=0)
    surface_pressure_hpa: float = Field(gt=0)
    solar_radiation_w_m2: float = Field(ge=0)
    direct_radiation_w_m2: float = Field(ge=0)
    diffuse_radiation_w_m2: float = Field(ge=0)
    observed_at: datetime
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    dew_point_c: float | None = None


class ThermalContext(BaseModel):
    """Compatibility context retained for the existing risk-service boundary."""

    air_temperature_c: float
    relative_humidity_percent: int
    wind_speed_kph: float
    source: str


class ThermalMethodology(BaseModel):
    heat_index: str
    wbgt: str
    limitations: list[str]


class ThermalStressResponse(BaseModel):
    heat_index_c: float
    heat_index_method: HeatIndexMethod
    estimated_wbgt_c: float
    natural_wet_bulb_temperature_c: float
    estimated_globe_temperature_c: float
    thermal_stress_level: ThermalStressLevel
    thermal_stress_factors: list[str]
    methodology: ThermalMethodology
