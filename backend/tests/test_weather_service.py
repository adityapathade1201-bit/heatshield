import unittest

import httpx

from services.weather_service import WeatherService, WeatherServiceError


def open_meteo_payload() -> dict[str, object]:
    return {
        "current": {
            "time": "2026-08-27T10:30",
            "temperature_2m": 30.2,
            "relative_humidity_2m": 61,
            "apparent_temperature": 34.4,
            "wind_speed_10m": 9.6,
            "surface_pressure": 930.0,
            "dew_point_2m": 22.2,
            "wet_bulb_temperature_2m": 25.5,
            "shortwave_radiation": 531.0,
            "direct_radiation": 350.0,
            "diffuse_radiation": 181.0,
            "cloud_cover": 35,
            "uv_index": 7.1,
            "weather_code": 2,
        },
        "hourly": {
            "time": ["2026-08-27T10:00", "2026-08-27T11:00"],
            "temperature_2m": [29.8, 30.2],
            "relative_humidity_2m": [63, 61],
            "wind_speed_10m": [8.9, 9.6],
            "surface_pressure": [930.0, 930.0],
            "dew_point_2m": [22.3, 22.2],
            "wet_bulb_temperature_2m": [25.4, 25.5],
            "shortwave_radiation": [420.0, 531.0],
            "direct_radiation": [290.0, 350.0],
            "diffuse_radiation": [130.0, 181.0],
            "cloud_cover": [42, 35],
            "uv_index": [5.5, 7.1],
            "apparent_temperature": [33.7, 34.4],
            "weather_code": [2, 2],
        },
        "daily": {
            "time": ["2026-08-27", "2026-08-28", "2026-08-29", "2026-08-30", "2026-08-31"],
            "weather_code": [2, 0, 3, 61, 80],
            "temperature_2m_max": [31.0, 32.0, 30.0, 29.0, 28.0],
            "temperature_2m_min": [23.0, 24.0, 23.0, 22.0, 22.0],
        },
    }


class WeatherServiceTests(unittest.IsolatedAsyncioTestCase):
    async def test_successful_api_response_is_normalized(self) -> None:
        transport = httpx.MockTransport(lambda request: httpx.Response(200, json=open_meteo_payload()))
        service = WeatherService(transport=transport)

        weather = await service.get_current_weather(latitude=18.5204, longitude=73.8567, location="Pune")
        forecast = await service.get_forecast(latitude=18.5204, longitude=73.8567, location="Pune")

        self.assertEqual(weather.source, "open-meteo")
        self.assertEqual(weather.conditions.temperature_c, 30.2)
        self.assertEqual(weather.conditions.apparent_temperature_c, 34.4)
        self.assertEqual(weather.conditions.wet_bulb_temperature_c, 25.5)
        self.assertEqual(weather.conditions.surface_pressure_hpa, 930.0)
        self.assertEqual(weather.conditions.dew_point_c, 22.2)
        self.assertEqual(weather.conditions.solar_radiation_w_m2, 531.0)
        self.assertEqual(weather.conditions.direct_radiation_w_m2, 350.0)
        self.assertEqual(weather.conditions.diffuse_radiation_w_m2, 181.0)
        self.assertEqual(weather.conditions.cloud_cover_percent, 35)
        self.assertEqual(weather.conditions.uv_index, 7.1)
        self.assertEqual(weather.conditions.weather_code, 2)
        self.assertEqual(forecast.days[0].condition, "Partly cloudy")
        self.assertIsNotNone(forecast.days[0].risk_level)
        self.assertEqual(len(forecast.days), 5)
        self.assertEqual(len(forecast.hourly), 2)
        self.assertEqual(forecast.hourly[0].humidity_percent, 63)


    async def test_null_thermal_input_is_returned_as_null(self) -> None:
        payload = open_meteo_payload()
        current = payload["current"]
        assert isinstance(current, dict)
        current["shortwave_radiation"] = None
        transport = httpx.MockTransport(lambda request: httpx.Response(200, json=payload))
        service = WeatherService(transport=transport)

        weather = await service.get_current_weather(latitude=18.5204, longitude=73.8567, location="Pune")

        self.assertIsNone(weather.conditions.solar_radiation_w_m2)

    async def test_api_timeout_is_wrapped(self) -> None:
        def timeout_handler(request: httpx.Request) -> httpx.Response:
            raise httpx.ReadTimeout("timed out", request=request)

        service = WeatherService(transport=httpx.MockTransport(timeout_handler))
        with self.assertRaises(WeatherServiceError):
            await service.get_current_weather(latitude=18.5204, longitude=73.8567, location="Pune")

    async def test_external_api_failure_is_wrapped(self) -> None:
        transport = httpx.MockTransport(lambda request: httpx.Response(503, request=request))
        service = WeatherService(transport=transport)
        with self.assertRaises(WeatherServiceError):
            await service.get_forecast(latitude=18.5204, longitude=73.8567, location="Pune")
