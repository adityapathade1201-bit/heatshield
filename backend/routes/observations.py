from fastapi import APIRouter, HTTPException
from models.observation import FieldObservation, ObservationResponse
import uuid

router = APIRouter(prefix="/api/observations", tags=["Observations"])

@router.post("", response_model=ObservationResponse)
async def submit_observation(observation: FieldObservation):
    """
    Submit a field observation from the mobile app.
    Currently implements a demo submission mechanism.
    """
    try:
        # In a real scenario, we would save this to a database.
        # For this hackathon implementation, we return a success response.
        return ObservationResponse(observation_id=str(uuid.uuid4()))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
