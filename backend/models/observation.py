from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime

class FieldObservation(BaseModel):
    location_ward: str = Field(description="Ward name or current location")
    feeling: Literal["Comfortable", "Warm", "Hot", "Very Hot", "Extremely Hot"]
    shade_available: Literal["Yes", "Partially", "No"]
    water_available: Literal["Yes", "No", "Don't know"]
    cooling_location: Literal["Yes", "No", "Don't know"]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ObservationResponse(BaseModel):
    status: str = "ok"
    observation_id: str
