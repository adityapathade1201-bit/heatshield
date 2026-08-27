"""FastAPI routes for Phase 7 AI Municipal Heat Intelligence."""

from fastapi import APIRouter, HTTPException, Query

from models.ai_intelligence import (
    ActionExplanationResponse,
    AIOverviewResponse,
    MunicipalBriefResponse,
    PriorityWardItem,
    WardAIAnalysisResponse,
)
from services.ai_service import (
    AIServiceError,
    analyze_ward,
    explain_action,
    generate_municipal_brief,
    get_ai_overview,
    get_priority_recommendations,
)

ai_router = APIRouter(prefix="/api/ai", tags=["AI Municipal Intelligence"])


@ai_router.get("/overview", response_model=AIOverviewResponse)
async def http_get_ai_overview():
    """Get comprehensive AI Heat Intelligence overview payload."""
    try:
        return await get_ai_overview()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI overview service error: {exc}") from exc


@ai_router.get("/ward-analysis", response_model=WardAIAnalysisResponse)
async def http_get_ward_analysis(
    ward: str = Query(default="Shivajinagar", description="Municipal ward name to analyze"),
):
    """Get explainable AI breakdown for a specific municipal ward."""
    try:
        return await analyze_ward(ward_name=ward)
    except AIServiceError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Ward analysis service error: {exc}") from exc


@ai_router.get("/priority-recommendations", response_model=list[PriorityWardItem])
async def http_get_priority_recommendations():
    """Get AI municipal priority ward rankings with data-backed rationale."""
    try:
        return await get_priority_recommendations()
    except Exception as exc:
        raise HTTPException(
            status_code=502, detail=f"Priority recommendations service error: {exc}"
        ) from exc


@ai_router.get("/municipal-brief", response_model=MunicipalBriefResponse)
async def http_get_municipal_brief():
    """Generate a concise operational briefing (<120 words) based on live backend data."""
    try:
        return await generate_municipal_brief()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Municipal brief service error: {exc}") from exc


@ai_router.get("/explain-action", response_model=ActionExplanationResponse)
async def http_explain_action(
    action_id: str = Query(description="Action ID e.g. 'act-1'"),
):
    """Get data-backed explainability rationale for a recommended response action."""
    try:
        return await explain_action(action_id=action_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Explain action service error: {exc}") from exc
