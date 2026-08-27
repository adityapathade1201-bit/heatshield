from datetime import datetime, timezone
import math
import unittest

from pydantic import ValidationError

from models.thermal import ThermalInputs
from services.thermal_service import (
    ThermalCalculationError,
    calculate_heat_index,
    calculate_thermal_stress,
    estimate_globe_temperature,
)


def thermal_inputs(**overrides: object) -> ThermalInputs:
    values: dict[str, object] = {
        "air_temperature_c": 27.3,
        "relative_humidity_percent": 65,
        "wind_speed_kph": 21.6,
        "surface_pressure_hpa": 930.0,
        "solar_radiation_w_m2": 896.0,
        "direct_radiation_w_m2": 670.0,
        "diffuse_radiation_w_m2": 226.0,
        "dew_point_c": 20.2,
        "observed_at": datetime(2026, 8, 27, 7, 0, tzinfo=timezone.utc),
        "latitude": 18.5204,
        "longitude": 73.8567,
    }
    values.update(overrides)
    return ThermalInputs(**values)


class ThermalServiceTests(unittest.TestCase):
    def test_normal_weather_uses_simple_heat_index(self) -> None:
        heat_index_c, method = calculate_heat_index(24.0, 50.0)
        self.assertEqual(method, "simple")
        self.assertTrue(23.0 < heat_index_c < 26.0)

    def test_hot_humid_weather_uses_rothfusz(self) -> None:
        heat_index_c, method = calculate_heat_index(32.2, 70.0)  # 90°F, 70% RH
        self.assertEqual(method, "rothfusz")
        self.assertAlmostEqual(heat_index_c, 41.0, places=1)

    def test_hot_dry_weather_applies_rothfusz_low_humidity_adjustment(self) -> None:
        heat_index_c, method = calculate_heat_index(40.0, 10.0)
        self.assertEqual(method, "rothfusz")
        self.assertLess(heat_index_c, 40.0)

    def test_high_solar_radiation_raises_globe_temperature(self) -> None:
        night_globe = estimate_globe_temperature(thermal_inputs(solar_radiation_w_m2=0, direct_radiation_w_m2=0, diffuse_radiation_w_m2=0))
        sun_globe = estimate_globe_temperature(thermal_inputs())
        self.assertGreater(sun_globe, night_globe)

    def test_low_wind_is_handled_without_non_finite_result(self) -> None:
        globe_c = estimate_globe_temperature(thermal_inputs(wind_speed_kph=0))
        self.assertTrue(math.isfinite(globe_c))

    def test_nighttime_and_zero_solar_radiation_are_handled_safely(self) -> None:
        result = calculate_thermal_stress(thermal_inputs(
            observed_at=datetime(2026, 8, 27, 18, 0, tzinfo=timezone.utc),
            solar_radiation_w_m2=0,
            direct_radiation_w_m2=0,
            diffuse_radiation_w_m2=0,
        ))
        self.assertTrue(math.isfinite(result.estimated_wbgt_c))
        self.assertTrue(math.isfinite(result.estimated_globe_temperature_c))

    def test_missing_required_thermal_values_are_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            ThermalInputs.model_validate({"air_temperature_c": 30})

    def test_invalid_humidity_is_rejected(self) -> None:
        with self.assertRaises(ThermalCalculationError):
            calculate_heat_index(30, 101)

    def test_invalid_temperature_is_rejected(self) -> None:
        with self.assertRaises(ThermalCalculationError):
            calculate_heat_index(71, 50)

    def test_response_never_contains_nan_or_infinity(self) -> None:
        result = calculate_thermal_stress(thermal_inputs())
        for value in (
            result.heat_index_c,
            result.estimated_wbgt_c,
            result.natural_wet_bulb_temperature_c,
            result.estimated_globe_temperature_c,
        ):
            self.assertTrue(math.isfinite(value))
