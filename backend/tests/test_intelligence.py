"""Tests for Phase 6 intelligence API endpoints and services."""

import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient
from main import app
from models.weather import HourlyWeatherObservation

from datetime import datetime, UTC


class TestIntelligenceAPI(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    @patch("services.intelligence_service.get_forecast")
    def test_get_trends_endpoint(self, mock_get_forecast: AsyncMock) -> None:
        now = datetime.now(UTC)
        obs1 = HourlyWeatherObservation(

            observed_at=now,
            temperature_c=28.0,
            apparent_temperature_c=30.0,
            humidity_percent=65.0,
            wind_speed_kph=15.0,
            solar_radiation_w_m2=400.0,
            uv_index=5.0,
            weather_code=0,
            condition="Clear",
        )
        mock_forecast = AsyncMock()
        mock_forecast.hourly = [obs1]
        mock_get_forecast.return_value = mock_forecast

        response = self.client.get("/api/trends?location=Pune")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("points", data)
        self.assertIn("location", data)
        self.assertEqual(data["location"], "Pune")

    def test_get_alerts_endpoint(self) -> None:
        response = self.client.get("/api/alerts")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("alerts", data)
        self.assertIn("active_count", data)

    def test_update_alert_status_endpoint(self) -> None:
        response = self.client.post("/api/alerts/alert-shivajinagar/status", json={"status": "acknowledged"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["new_status"], "acknowledged")

    def test_get_response_actions_endpoint(self) -> None:
        response = self.client.get("/api/response-actions")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("actions", data)
        self.assertIn("pending_count", data)

    def test_update_response_action_status_endpoint(self) -> None:
        response = self.client.post("/api/response-actions/act-1/status", json={"status": "completed"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["new_status"], "completed")

    def test_get_municipal_summary_endpoint(self) -> None:
        response = self.client.get("/api/municipal-summary")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("active_alerts", data)
        self.assertIn("actions_pending", data)
        self.assertIn("actions_completed", data)


if __name__ == "__main__":
    unittest.main()
