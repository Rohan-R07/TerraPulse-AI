import logging
import requests
import re
import time

logger = logging.getLogger("TerraPulseBackend.Weather")

class WeatherService:
    _cache: dict = {}

    @staticmethod
    def get_weather_forecast(state: str, district: str) -> dict:
        """Fetch weather by state and district names using the geocoding API."""
        location_str = f"{district}, {state}"
        return WeatherService.get_live_weather(location_str)

    @staticmethod
    def get_live_weather(location_str: str) -> dict:
        """Parse location (either coordinates or city name) and fetch real-time weather from Open-Meteo."""
        if not location_str:
            location_str = "Pune, Maharashtra"
        
        now = time.time()
        if location_str in WeatherService._cache:
            entry = WeatherService._cache[location_str]
            if now - entry["timestamp"] < 300:  # 5 min in-memory cache
                return entry["data"]
        
        lat, lon = None, None
        
        # Try to parse lat/lon coords if present
        coord_match = re.findall(r'[-+]?\d*\.\d+', location_str)
        if len(coord_match) >= 2:
            try:
                lat, lon = float(coord_match[0]), float(coord_match[1])
            except Exception:
                pass
        
        # Otherwise, geocode using Open-Meteo search API
        if lat is None or lon is None:
            # Extract first segment (city or region)
            city = location_str.split(",")[0].strip()
            try:
                geo_res = requests.get(
                    f"https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1&language=en&format=json",
                    timeout=10
                )
                if geo_res.status_code == 200:
                    results = geo_res.json().get("results", [])
                    if results:
                        lat = results[0]["latitude"]
                        lon = results[0]["longitude"]
                        logger.info(f"Geocoded location '{location_str}' to ({lat}, {lon})")
            except Exception as e:
                logger.warning(f"Failed to geocode location '{location_str}': {e}")
                
        if lat is None or lon is None:
            lat, lon = 18.5204, 73.8567  # Default fallback coordinates for Pune
            logger.info("Using fallback coordinates (Pune)")

        try:
            url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,rain,weather_code,soil_moisture_0_to_1cm,soil_moisture_9_to_27cm"
            weather_res = requests.get(url, timeout=10)
            if weather_res.status_code == 200:
                current = weather_res.json().get("current", {})
                temp = current.get("temperature_2m", 28.0)
                humidity = current.get("relative_humidity_2m", 35.0)
                rain = current.get("rain", 0.0)
                code = current.get("weather_code", 0)
                
                # Convert volumetric soil moisture (m³/m³) to percentage
                sm_surface = current.get("soil_moisture_0_to_1cm")
                sm_root = current.get("soil_moisture_9_to_27cm")
                sm_val = sm_root if sm_root is not None else sm_surface
                moisture_pct = round(float(sm_val) * 100, 1) if sm_val is not None else 32.0
                
                # Simple weather code mapping
                w_desc = {
                    0: "Clear sky", 
                    1: "Mainly clear", 
                    2: "Partly cloudy", 
                    3: "Overcast", 
                    45: "Foggy", 
                    51: "Light drizzle", 
                    61: "Slight rain", 
                    71: "Slight snow", 
                    80: "Rain showers", 
                    95: "Thunderstorm"
                }
                forecast = w_desc.get(code, "Partly cloudy")
                
                res_data = {
                    "temp": temp,
                    "humidity": humidity,
                    "rainfall": f"{rain} mm",
                    "moisture": moisture_pct,
                    "forecast": f"{forecast}. Currently {temp}°C, {humidity}% humidity, {moisture_pct}% soil moisture."
                }
                WeatherService._cache[location_str] = {"timestamp": now, "data": res_data}
                return res_data
        except Exception as e:
            logger.error(f"Failed to fetch weather from Open-Meteo: {e}")
            
        return {
            "temp": 28.0,
            "humidity": 35.0,
            "rainfall": "12 mm",
            "moisture": 32.0,
            "forecast": "Partly cloudy"
        }
