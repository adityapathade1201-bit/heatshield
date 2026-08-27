from datetime import datetime, timezone
import unittest

from models.risk import RiskLevel
from models.thermal import ThermalMethodology, ThermalStressResponse
from models.weather import WeatherConditions, WeatherResponse
from services.risk_service import calculate_risk_assessment


METHODOLOGY = ThermalMethodology(heat_index="test", wbgt="test", limitations=[])


def weather(**overrides: object) -> WeatherResponse:
    values: dict[str, object] = {
        "temperature_c": 20.0,
        "apparent_temperature_c": 20.0,
        "humidity_percent": 40,
        "wind_speed_kph": 25.0,
        "surface_pressure_hpa": 950.0,
        "dew_point_c": 10.0,
        "wet_bulb_temperature_c": 14.0,
        "solar_radiation_w_m2": 100.0,
        "direct_radiation_w_m2": 80.0,
        "diffuse_radiation_w_m2": 20.0,
        "cloud_cover_percent": 20,
        "uv_index": 2.0,
        "weather_code": 0,
        "condition": "Clear sky",
    }
    values.update(overrides)
    return WeatherResponse(
        location="Pune",
        observed_at=datetime(2026, 8, 27, 7, 0, tzinfo=timezone.utc),
        conditions=WeatherConditions(**values),
        source="open-meteo",
    )


def thermal(*, heat_index_c: float, estimated_wbgt_c: float) -> ThermalStressResponse:
    return ThermalStressResponse(
        heat_index_c=heat_index_c,
        heat_index_method="simple",
        estimated_wbgt_c=estimated_wbgt_c,
        natural_wet_bulb_temperature_c=heat_index_c - 5,
        estimated_globe_temperature_c=estimated_wbgt_c,
        thermal_stress_level="normal",
        thermal_stress_factors=[],
        methodology=METHODOLOGY,
    )


class RiskServiceTests(unittest.TestCase):
    def assert_level(self, expected: RiskLevel, weather_data: WeatherResponse, thermal_data: ThermalStressResponse) -> None:
        score, level, drivers = calculate_risk_assessment(weather_data, thermal_data)
        self.assertEqual(level, expected)
        self.assertGreaterEqual(score, 0)
        self.assertLessEqual(score, 100)
        self.assertTrue(drivers)

    def test_low_risk_weather(self) -> None:
        self.assert_level("low", weather(), thermal(heat_index_c=20, estimated_wbgt_c=20))

    def test_moderate_risk_weather(self) -> None:
        self.assert_level("moderate", weather(), thermal(heat_index_c=32, estimated_wbgt_c=28))

    def test_high_risk_weather(self) -> None:
        self.assert_level("high", weather(), thermal(heat_index_c=39, estimated_wbgt_c=30))

    def test_extreme_wbgt_produces_severe_risk(self) -> None:
        self.assert_level(
            "severe",
            weather(
                temperature_c=40,
                apparent_temperature_c=40,
                humidity_percent=75,
                wind_speed_kph=5,
                solar_radiation_w_m2=800,
                uv_index=8,
            ),
            thermal(heat_index_c=46, estimated_wbgt_c=32),
        )

    def test_score_is_bounded(self) -> None:
        score, _, _ = calculate_risk_assessment(
            weather(
                temperature_c=70,
                apparent_temperature_c=70,
                humidity_percent=100,
                wind_speed_kph=0,
                solar_radiation_w_m2=2000,
                uv_index=20,
            ),
            thermal(heat_index_c=60, estimated_wbgt_c=60),
        )
        self.assertEqual(score, 100)

    def test_drivers_explain_contributing_factors(self) -> None:
        _, _, drivers = calculate_risk_assessment(
            weather(temperature_c=36, apparent_temperature_c=37, humidity_percent=70),
            thermal(heat_index_c=35, estimated_wbgt_c=29),
        )
        names = {driver.name for driver in drivers}
        self.assertIn("Estimated WBGT", names)
        self.assertIn("Heat Index", names)
        self.assertTrue(all("component" in driver.description for driver in drivers if driver.name != "Wind speed"))
