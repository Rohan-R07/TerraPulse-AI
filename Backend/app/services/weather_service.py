import logging

logger = logging.getLogger("TerraPulseBackend.Weather")

class WeatherService:
    @staticmethod
    def get_weather_forecast(state: str, district: str) -> dict:
        # Mock weather details based on common agricultural regions
        weather_profiles = {
            "Maharashtra": {"temp": 32, "moisture": 28, "rainfall": 8, "forecast": "Dry for next 5 days. High solar radiation index."},
            "Punjab": {"temp": 35, "moisture": 32, "rainfall": 4, "forecast": "Hot dry winds. Zero precipitation predicted. Irrigate crop regularly."},
            "Karnataka": {"temp": 30, "moisture": 30, "rainfall": 15, "forecast": "Light monsoon drizzle expected. Humidity around 82%."},
            "Telangana": {"temp": 33, "moisture": 25, "rainfall": 2, "forecast": "Severe heat wave advisory. High water evaporation rate."}
        }
        return weather_profiles.get(state, {"temp": 28, "moisture": 35, "rainfall": 12, "forecast": "Partly cloudy. Scattered rain showers expected."})
