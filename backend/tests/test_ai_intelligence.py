"""Unit tests for Phase 7 AI Municipal Heat Intelligence endpoints and services."""

from datetime import UTC, datetime
import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from main import app
from models.ai_intelligence import (
    ActionExplanationResponse,
    AIOverviewResponse,
    MunicipalBriefResponse,
    PriorityWardItem,
    WardAIAnalysisResponse,
)
from models.risk import RiskResponse


class TestAIIntelligenceEndpoints(unittest.TestCase):
    """Test suite for AI Heat Intelligence endpoints."""

    def setUp(self):
        self.client = TestClient(app)

    def _mock_risk(self):
        return RiskResponse(
            location="Pune",
            assessed_at=datetime.now(UTC),
            score=11,
            level="low",
            source="open-meteo+thermal",
            drivers=[],
            peak_window=None,
        )


    @patch("services.ai_service.get_current_weather")
    @patch("services.ai_service.get_risk_summary")
    @patch("services.ai_service.calculate_current_thermal_stress")
    @patch("services.ai_service.get_24h_heat_trend")
    def test_get_ai_overview(self, mock_trend, mock_thermal, mock_risk, mock_weather):
        mock_risk.return_value = self._mock_risk()
        mock_trend.return_value.peak_point.risk_score = 27
        mock_trend.return_value.peak_point.risk_level = "Moderate"
        mock_trend.return_value.peak_point.formatted_time = "11:30 AM"

        response = self.client.get("/api/ai/overview")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        overview = AIOverviewResponse(**data)
        self.assertIn(overview.city_risk_level, ["low", "moderate", "high", "severe"])

        self.assertGreaterEqual(overview.city_risk_score, 0)
        self.assertLessEqual(overview.city_risk_score, 100)
        self.assertIn("System Mode:", overview.system_note)
        self.assertEqual(overview.data_quality.overall_status, "Optimal")
        self.assertGreater(len(overview.ward_comparisons), 0)

    @patch("services.ai_service.get_current_weather")
    @patch("services.ai_service.get_risk_summary")
    @patch("services.ai_service.calculate_current_thermal_stress")
    @patch("services.ai_service.get_24h_heat_trend")
    def test_get_ward_analysis(self, mock_trend, mock_thermal, mock_risk, mock_weather):
        mock_risk.return_value = self._mock_risk()
        mock_trend.return_value.peak_point.risk_score = 27
        mock_trend.return_value.peak_point.risk_level = "Moderate"
        mock_trend.return_value.peak_point.formatted_time = "11:30 AM"

        response = self.client.get("/api/ai/ward-analysis?ward=Shivajinagar")
        if response.status_code != 200:
            print("WARD ANALYSIS ERROR DETAIL:", response.json())
        self.assertEqual(response.status_code, 200)

        data = response.json()

        analysis = WardAIAnalysisResponse(**data)
        self.assertEqual(analysis.ward, "Shivajinagar")
        self.assertGreaterEqual(analysis.current_risk_score, 0)
        self.assertGreaterEqual(analysis.forecast_peak_score, 0)
        self.assertIn("Shivajinagar", analysis.interpretation)
        self.assertGreater(len(analysis.supporting_factors), 0)

    @patch("services.ai_service.get_current_weather")
    @patch("services.ai_service.get_risk_summary")
    @patch("services.ai_service.calculate_current_thermal_stress")
    @patch("services.ai_service.get_24h_heat_trend")
    def test_get_priority_recommendations(self, mock_trend, mock_thermal, mock_risk, mock_weather):
        mock_risk.return_value = self._mock_risk()
        mock_trend.return_value.peak_point.risk_score = 27
        mock_trend.return_value.peak_point.risk_level = "Moderate"
        mock_trend.return_value.peak_point.formatted_time = "11:30 AM"

        response = self.client.get("/api/ai/priority-recommendations")
        if response.status_code != 200:
            print("PRIORITY RECS ERROR DETAIL:", response.json())
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)

        item = PriorityWardItem(**data[0])
        self.assertEqual(item.rank, 1)
        self.assertIn(item.priority_level, ["High", "Medium", "Standard"])
        self.assertIn("Forecast peak risk", item.reason)

    @patch("services.ai_service.get_current_weather")
    @patch("services.ai_service.get_risk_summary")
    @patch("services.ai_service.calculate_current_thermal_stress")
    @patch("services.ai_service.get_24h_heat_trend")
    def test_generate_municipal_brief(self, mock_trend, mock_thermal, mock_risk, mock_weather):
        mock_risk.return_value = self._mock_risk()
        mock_trend.return_value.peak_point.risk_score = 27
        mock_trend.return_value.peak_point.risk_level = "Moderate"
        mock_trend.return_value.peak_point.formatted_time = "11:30 AM"

        response = self.client.get("/api/ai/municipal-brief")
        if response.status_code != 200:
            print("MUNICIPAL BRIEF ERROR DETAIL:", response.json())
        self.assertEqual(response.status_code, 200)

        data = response.json()

        brief = MunicipalBriefResponse(**data)
        self.assertIn("MUNICIPAL HEAT BRIEF:", brief.brief_text)
        self.assertLessEqual(brief.word_count, 120)
        self.assertIn("Watch window:", brief.brief_text)

    @patch("services.ai_service.get_current_weather")
    @patch("services.ai_service.get_risk_summary")
    def test_explain_action(self, mock_risk, mock_weather):
        mock_risk.return_value = self._mock_risk()

        response = self.client.get("/api/ai/explain-action?action_id=act-1")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        exp = ActionExplanationResponse(**data)
        self.assertEqual(exp.action_id, "act-1")
        self.assertGreater(len(exp.supporting_factors), 0)
        self.assertIn("hydration", exp.title.lower())


if __name__ == "__main__":
    unittest.main()
