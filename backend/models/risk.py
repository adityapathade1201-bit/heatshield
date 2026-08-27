from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

RiskLevel = Literal["low", "moderate", "high", "severe"]


class RiskDriver(BaseModel):
    name: str
    value: str
    description: str


class PeakHeatWindow(BaseModel):
    time: datetime
    formatted_time: str
    risk_score: int = Field(ge=0, le=100)
    risk_level: RiskLevel
    temperature_c: float | None = None
    apparent_temperature_c: float | None = None
    humidity_percent: int | None = None
    uv_index: float | None = None
    estimated_wbgt_c: float | None = None


class RiskResponse(BaseModel):
    location: str
    assessed_at: datetime
    level: RiskLevel
    score: int = Field(ge=0, le=100, description="Deterministic weather and thermal risk score")
    drivers: list[RiskDriver]
    source: Literal["mock", "open-meteo+thermal"]
    peak_window: PeakHeatWindow | None = None



class LocationRisk(BaseModel):
    id: str
    name: str
    ward: str
    latitude: float
    longitude: float
    risk_level: RiskLevel
    risk_score: int = Field(ge=0, le=100)


class LocationsResponse(BaseModel):
    locations: list[LocationRisk]
    source: Literal["mock", "open-meteo+thermal"]

