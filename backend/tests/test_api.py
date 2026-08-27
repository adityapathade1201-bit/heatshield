import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from main import app
from models.weather import WeatherConditions, WeatherResponse

class ApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_health_check(self) -> None:
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_invalid_coordinates_are_rejected(self) -> None:
        response = self.client.get("/api/weather?latitude=100&longitude=73.8567")
        self.assertEqual(response.status_code, 422)

    def test_vite_5174_origin_is_allowed(self) -> None:
        response = self.client.get("/health", headers={"Origin": "http://localhost:5174"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["access-control-allow-origin"], "http://localhost:5174")

    @patch("services.thermal_service.get_current_weather", new_callable=AsyncMock)
    def test_thermal_endpoint_returns_estimated_wbgt(self, get_current_weather: AsyncMock) -> None:
        get_current_weather.return_value = WeatherResponse(
            location="Pune",
            observed_at="2026-08-27T07:00:00+00:00",
            conditions=WeatherConditions(
                temperature_c=27.3,
                apparent_temperature_c=28.0,
                humidity_percent=65,
                wind_speed_kph=21.6,
                surface_pressure_hpa=930,
                dew_point_c=20.2,
                wet_bulb_temperature_c=22.0,
                solar_radiation_w_m2=896,
                direct_radiation_w_m2=670,
                diffuse_radiation_w_m2=226,
                cloud_cover_percent=10,
                uv_index=5,
                weather_code=0,
                condition="Clear sky",
            ),
            source="open-meteo",
        )

        response = self.client.get(
            "/api/thermal?latitude=18.5204&longitude=73.8567&location=Pune"
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("estimated_wbgt_c", response.json())
        self.assertNotIn("measured_wbgt_c", response.json())
        get_current_weather.assert_awaited_once_with(
            latitude=18.5204, longitude=73.8567, location="Pune"
        )

    @patch("services.risk_service.get_current_weather", new_callable=AsyncMock)
    def test_risk_endpoint_uses_live_weather_and_calculated_source(self, get_current_weather: AsyncMock) -> None:
        get_current_weather.return_value = WeatherResponse(
            location="Pune",
            observed_at="2026-08-27T07:00:00+00:00",
            conditions=WeatherConditions(
                temperature_c=36,
                apparent_temperature_c=40,
                humidity_percent=75,
                wind_speed_kph=5,
                surface_pressure_hpa=930,
                dew_point_c=28,
                wet_bulb_temperature_c=29,
                solar_radiation_w_m2=800,
                direct_radiation_w_m2=600,
                diffuse_radiation_w_m2=200,
                cloud_cover_percent=10,
                uv_index=8,
                weather_code=0,
                condition="Clear sky",
            ),
            source="open-meteo",
        )

        response = self.client.get("/api/risk?location=Pune")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["source"], "open-meteo+thermal")
        self.assertGreater(response.json()["score"], 0)
        self.assertTrue(response.json()["drivers"])

    @patch("services.risk_service.get_current_weather", new_callable=AsyncMock)
    def test_risk_endpoint_rejects_missing_thermal_inputs(self, get_current_weather: AsyncMock) -> None:
        get_current_weather.return_value = WeatherResponse(
            location="Pune",
            observed_at="2026-08-27T07:00:00+00:00",
            conditions=WeatherConditions(
                temperature_c=None,
                apparent_temperature_c=None,
                humidity_percent=50,
                wind_speed_kph=5,
                surface_pressure_hpa=930,
                dew_point_c=None,
                wet_bulb_temperature_c=None,
                solar_radiation_w_m2=None,
                direct_radiation_w_m2=None,
                diffuse_radiation_w_m2=None,
                cloud_cover_percent=None,
                uv_index=None,
                weather_code=None,
                condition="Unknown conditions",
            ),
            source="open-meteo",
        )

        response = self.client.get("/api/risk?location=Pune")

        self.assertEqual(response.status_code, 503)

    @patch("services.risk_service.get_current_weather", new_callable=AsyncMock)
    def test_locations_endpoint_returns_calculated_source(self, get_current_weather: AsyncMock) -> None:
        get_current_weather.return_value = WeatherResponse(
            location="Shivajinagar",
            observed_at="2026-08-27T07:00:00+00:00",
            conditions=WeatherConditions(
                temperature_c=25,
                apparent_temperature_c=25,
                humidity_percent=40,
                wind_speed_kph=15,
                surface_pressure_hpa=930,
                dew_point_c=12,
                wet_bulb_temperature_c=16,
                solar_radiation_w_m2=300,
                direct_radiation_w_m2=200,
                diffuse_radiation_w_m2=100,
                cloud_cover_percent=10,
                uv_index=3,
                weather_code=0,
                condition="Clear sky",
            ),
            source="open-meteo",
        )

        response = self.client.get("/api/locations")

        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(json_data["source"], "open-meteo+thermal")
        self.assertEqual(len(json_data["locations"]), 4)
        for loc in json_data["locations"]:
            self.assertIn("risk_level", loc)
            self.assertIn("risk_score", loc)

