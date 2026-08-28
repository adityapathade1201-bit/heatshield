"""HeatWatch API application entry point."""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routes.ai_intelligence import ai_router
from routes.alerts import router as alerts_router
from routes.forecast import router as forecast_router
from routes.intelligence import router as intelligence_router
from routes.risk import router as risk_router
from routes.thermal import router as thermal_router
from routes.weather import router as weather_router
from routes.observations import router as observations_router

app = FastAPI(
    title="HeatWatch API",
    version="0.1.0",
    description="Backend foundation for municipal heat-health decision support.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    """Avoid leaking implementation details while preserving a consistent API error."""
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected server error occurred."},
    )


@app.get("/health", tags=["System"])
async def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "heatwatch-api"}


app.include_router(weather_router)
app.include_router(forecast_router)
app.include_router(risk_router)
app.include_router(thermal_router)
app.include_router(intelligence_router)
app.include_router(ai_router)
app.include_router(observations_router)
app.include_router(alerts_router)


