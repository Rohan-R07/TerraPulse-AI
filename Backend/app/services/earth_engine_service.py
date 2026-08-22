import os
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List
from app.config import settings

logger = logging.getLogger("TerraPulseBackend.EarthEngine")

# Field coordinates mapped to real coordinates in India [longitude, latitude]
FIELD_GEOMETRIES = {
    "north": {
        "type": "Polygon",
        "coordinates": [[[75.80, 30.90], [75.81, 30.90], [75.81, 30.91], [75.80, 30.91], [75.80, 30.90]]]
    },
    "south": {
        "type": "Polygon",
        "coordinates": [[[73.85, 18.52], [73.86, 18.52], [73.86, 18.53], [73.85, 18.53], [73.85, 18.52]]]
    },
    "east": {
        "type": "Polygon",
        "coordinates": [[[73.88, 18.52], [73.89, 18.52], [73.89, 18.53], [73.88, 18.53], [73.88, 18.52]]]
    },
    "west": {
        "type": "Polygon",
        "coordinates": [[[73.82, 18.52], [73.83, 18.52], [73.83, 18.53], [73.82, 18.53], [73.82, 18.52]]]
    }
}

# Try importing ee, but handle ImportError if package is not installed or auth is not initialized.
ee_available = False
try:
    import ee
    project_id = settings.EARTH_ENGINE_PROJECT_ID or os.environ.get("EARTH_ENGINE_PROJECT_ID")
    if project_id:
        logger.info(f"Initializing Earth Engine with project: {project_id}")
        ee.Initialize(project=project_id)
    else:
        logger.info("Initializing Earth Engine with default project settings")
        ee.Initialize()
    ee_available = True
    logger.info("Google Earth Engine successfully initialized.")
except Exception as e:
    logger.warning(f"Google Earth Engine credentials not initialized: {e}. Running in Fallback Mode.")

def mask_s2_clouds(image):
    qa = image.select('QA60')
    cloud_bit_mask = 1 << 10
    cirrus_bit_mask = 1 << 11
    mask = qa.bitwiseAnd(cloud_bit_mask).eq(0).And(
        qa.bitwiseAnd(cirrus_bit_mask).eq(0)
    )
    return image.updateMask(mask)

class EarthEngineService:
    @staticmethod
    def is_live() -> bool:
        return ee_available and not settings.TERRAPULSE_DEMO_MODE

    @staticmethod
    def _get_demo_field_values(field_id: str):
        if field_id in ("west", "west-field"):
            return 0.41, 0.58, "Vegetation stress detected"
        elif field_id in ("north", "north-field"):
            return 0.72, 0.70, "Healthy"
        elif field_id in ("south", "south-field"):
            return 0.54, 0.60, "Moderate stress"
        else:
            return 0.63, 0.67, "Healthy"

    @classmethod
    def get_satellite_data(cls, field_id: str, mode: str = "demo", date_str: str = None) -> Dict[str, Any]:
        use_live = (mode == "live" and cls.is_live())
        
        # Clean the field ID to standard format
        clean_field_id = "north"
        for fid in ["north", "south", "east", "west"]:
            if fid in field_id.lower():
                clean_field_id = fid
                break

        if not use_live:
            acquisition_date = date_str if date_str else "2026-08-10"
            ndvi_val, prev_ndvi, status = cls._get_demo_field_values(clean_field_id)
            return {
                "fieldId": field_id,
                "dataSource": "DEMO — Sentinel-2 Sample Dataset",
                "isLive": False,
                "ndvi": ndvi_val,
                "prevNdvi": prev_ndvi,
                "acquisitionDate": acquisition_date,
                "cloudCover": 1.2,
                "resolution": "10m",
                "status": status,
                "requested_date": date_str or "2026-08-10",
                "actual_image_date": acquisition_date,
                "image_available": True
            }

        try:
            import ee
            if clean_field_id not in FIELD_GEOMETRIES:
                raise ValueError(f"Unknown field geometry for ID: {field_id}")
            
            geo_info = FIELD_GEOMETRIES[clean_field_id]
            geometry = ee.Geometry.Polygon(geo_info["coordinates"])

            if not date_str:
                date_str = "2026-08-18"

            # Parse requested date and create a +/- 5 days window
            selected_dt = datetime.strptime(date_str, "%Y-%m-%d")
            start_date = (selected_dt - timedelta(days=5)).strftime("%Y-%m-%d")
            end_date = (selected_dt + timedelta(days=5)).strftime("%Y-%m-%d")

            # Query Sentinel-2 SR Harmonized
            s2_collection = (
                ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
                .filterBounds(geometry)
                .filterDate(start_date, end_date)
                .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20))
            )

            count = int(s2_collection.size().getInfo())
            if count == 0:
                # No image found in the range, return gracefully
                return {
                    "fieldId": field_id,
                    "dataSource": "LIVE — Google Earth Engine (Sentinel-2)",
                    "isLive": True,
                    "image_available": False,
                    "message": f"No suitable Sentinel-2 image was available within ±5 days of {date_str}."
                }

            # Select least cloudy image
            best_image = s2_collection.sort("CLOUDY_PIXEL_PERCENTAGE").first()

            # Apply cloud/cirrus masking
            masked_image = mask_s2_clouds(best_image)

            # Calculate NDVI
            ndvi_img = masked_image.normalizedDifference(["B8", "B4"]).rename("ndvi")

            # Spatial mean reduction
            stats = ndvi_img.reduceRegion(
                reducer=ee.Reducer.mean(),
                geometry=geometry,
                scale=10
            ).getInfo()

            ndvi_value = stats.get("ndvi")
            if ndvi_value is None:
                return {
                    "fieldId": field_id,
                    "dataSource": "LIVE — Google Earth Engine (Sentinel-2)",
                    "isLive": True,
                    "image_available": False,
                    "message": "All Sentinel-2 image pixels were masked out due to cloud cover."
                }

            ndvi_value = round(float(ndvi_value), 3)

            # Extract image acquisition date
            img_date_ms = best_image.get("system:time_start").getInfo()
            actual_date = datetime.fromtimestamp(img_date_ms / 1000.0).strftime("%Y-%m-%d")
            cloud_cover = round(float(best_image.get("CLOUDY_PIXEL_PERCENTAGE").getInfo()), 1)

            # Retrieve baseline values
            ndvi_val_demo, prev_ndvi, _ = cls._get_demo_field_values(clean_field_id)

            status = "Healthy" if ndvi_value >= 0.7 else "Moderate stress" if ndvi_value >= 0.5 else "Vegetation stress detected"

            return {
                "fieldId": field_id,
                "dataSource": "LIVE — Google Earth Engine (Sentinel-2)",
                "isLive": True,
                "ndvi": ndvi_value,
                "prevNdvi": prev_ndvi,
                "acquisitionDate": actual_date,
                "cloudCover": cloud_cover,
                "resolution": "10m",
                "status": status,
                "requested_date": date_str,
                "actual_image_date": actual_date,
                "image_available": True
            }

        except Exception as e:
            logger.error(f"Failed to fetch live Earth Engine data: {e}. Falling back to demo data.")
            acquisition_date = date_str if date_str else "2026-08-10"
            ndvi_val, prev_ndvi, status = cls._get_demo_field_values(clean_field_id)
            return {
                "fieldId": field_id,
                "dataSource": "DEMO — Sentinel-2 Sample Dataset (GEE Fallback)",
                "isLive": False,
                "ndvi": ndvi_val,
                "prevNdvi": prev_ndvi,
                "acquisitionDate": acquisition_date,
                "cloudCover": 1.2,
                "resolution": "10m",
                "status": status,
                "requested_date": date_str or "2026-08-10",
                "actual_image_date": acquisition_date,
                "image_available": True,
                "gee_error": str(e)
            }

    @classmethod
    def get_historical_ndvi(cls, field_id: str, limit: int = 8) -> List[Dict[str, Any]]:
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"]
        
        # Clean the field ID to standard format
        clean_field_id = "north"
        for fid in ["north", "south", "east", "west"]:
            if fid in field_id.lower():
                clean_field_id = fid
                break

        if clean_field_id == "west":
            values = [0.28, 0.32, 0.38, 0.42, 0.45, 0.48, 0.41, 0.39]
        elif clean_field_id == "north":
            values = [0.48, 0.52, 0.60, 0.68, 0.72, 0.75, 0.82, 0.80]
        elif clean_field_id == "south":
            values = [0.35, 0.40, 0.48, 0.55, 0.58, 0.62, 0.64, 0.60]
        else:
            values = [0.40, 0.45, 0.52, 0.58, 0.63, 0.65, 0.71, 0.68]
            
        history = []
        for m, val in zip(months, values):
            history.append({
                "date": m,
                "value": val,
                "month": m,
                "ndvi": val
            })
        return history

    @classmethod
    def get_historical_moisture(cls, field_id: str, limit: int = 8) -> List[Dict[str, Any]]:
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"]
        
        # Clean the field ID to standard format
        clean_field_id = "north"
        for fid in ["north", "south", "east", "west"]:
            if fid in field_id.lower():
                clean_field_id = fid
                break

        if clean_field_id == "west":
            values = [28, 25, 22, 20, 18, 24, 26, 22]
        elif clean_field_id == "north":
            values = [38, 35, 32, 34, 37, 40, 42, 41]
        elif clean_field_id == "south":
            values = [32, 30, 28, 26, 28, 32, 35, 28]
        else:
            values = [35, 33, 30, 31, 33, 36, 38, 35]
            
        history = []
        for m, val in zip(months, values):
            history.append({
                "date": m,
                "value": val,
                "month": m,
                "moisture": val
            })
        return history

