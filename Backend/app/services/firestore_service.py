import time
import uuid
import logging
import firebase_admin
from firebase_admin import credentials, firestore
from app.config import settings

logger = logging.getLogger("TerraPulseBackend.Firestore")

# Global clients
db = None
in_memory_db = {
    "farms": [
        {"id": "farm-1", "name": "Green Valley Farm", "location": "Pune, Maharashtra"}
    ],
    "fields": [
        {
            "id": "north",
            "farm_id": "farm-1",
            "crop": "Wheat",
            "crop_stage": "Sowing",
            "acreage": 32.0,
            "soil_type": "Loamy",
            "state": "Punjab",
            "district": "Ludhiana",
            "location": "Ludhiana, Punjab",
            "geometry": None,
            "health_score": 82.0,
            "risk_level": "LOW",
            "name": "North Field",
            "acres": 32.0,
            "health": 82.0,
            "ndvi": 0.72,
            "moisture": 41.0,
            "risk": "Low",
            "vegetation": "Healthy",
            "stress": "Low",
            "soilType": "Loamy",
            "recommendations": [
                "Maintain current irrigation schedule",
                "Monitor for rust fungus in next 2 weeks",
                "Apply foliar spray at flowering stage"
            ],
            "polygon": [[8.0, 12.0], [44.0, 8.0], [48.0, 38.0], [12.0, 42.0]]
        },
        {
            "id": "south",
            "farm_id": "farm-1",
            "crop": "Soybean",
            "crop_stage": "Vegetative",
            "acreage": 28.0,
            "soil_type": "Clay",
            "state": "Maharashtra",
            "district": "Pune",
            "location": "Pune, Maharashtra",
            "geometry": None,
            "health_score": 64.0,
            "risk_level": "MEDIUM",
            "name": "South Field",
            "acres": 28.0,
            "health": 64.0,
            "ndvi": 0.54,
            "moisture": 28.0,
            "risk": "Medium",
            "vegetation": "Moderate stress",
            "stress": "Medium",
            "soilType": "Clay",
            "recommendations": [
                "Increase irrigation frequency",
                "Inspect for potassium deficiency",
                "Introduce cover crop after harvest"
            ],
            "polygon": [[8.0, 50.0], [46.0, 48.0], [50.0, 86.0], [10.0, 88.0]]
        },
        {
            "id": "east",
            "farm_id": "farm-1",
            "crop": "Cotton",
            "crop_stage": "Flowering",
            "acreage": 36.0,
            "soil_type": "Sandy Loam",
            "state": "Maharashtra",
            "district": "Pune",
            "location": "Pune, Maharashtra",
            "geometry": None,
            "health_score": 71.0,
            "risk_level": "LOW",
            "name": "East Field",
            "acres": 36.0,
            "health": 71.0,
            "ndvi": 0.63,
            "moisture": 35.0,
            "risk": "Low",
            "vegetation": "Healthy",
            "stress": "Low",
            "soilType": "Sandy Loam",
            "recommendations": [
                "Apply bio-fertilizer in 10 days",
                "Maintain pest monitoring traps",
                "Plan crop rotation with legumes next season"
            ],
            "polygon": [[56.0, 10.0], [92.0, 14.0], [88.0, 44.0], [58.0, 40.0]]
        },
        {
            "id": "west",
            "farm_id": "farm-1",
            "crop": "Maize",
            "crop_stage": "Flowering",
            "acreage": 28.0,
            "soil_type": "Sandy",
            "state": "Maharashtra",
            "district": "Pune",
            "location": "Pune, Maharashtra",
            "geometry": None,
            "health_score": 55.0,
            "risk_level": "HIGH",
            "name": "West Field",
            "acres": 28.0,
            "health": 55.0,
            "ndvi": 0.41,
            "moisture": 22.0,
            "risk": "High",
            "vegetation": "High stress",
            "stress": "High",
            "soilType": "Sandy",
            "recommendations": [
                "Immediate irrigation required",
                "Test soil for organic matter",
                "Apply compost amendment",
                "Consider drought-tolerant cover crop"
            ],
            "polygon": [[58.0, 50.0], [94.0, 52.0], [90.0, 88.0], [56.0, 86.0]]
        }
    ],
    "actions": [
        {"id": "1", "field_id": "west", "field": "West Field", "recommendation": "Irrigate crop immediately to alleviate water stress", "priority": "High", "dueDate": "2026-08-21", "source": "AI Advisory", "status": "PENDING"},
        {"id": "2", "field_id": "north", "field": "North Field", "recommendation": "Inspect for Leaf Curl disease symptoms", "priority": "Medium", "dueDate": "2026-08-23", "source": "AI Scanner", "status": "PENDING"}
    ],
    "feedback": []
}

def initialize_firestore():
    global db
    if settings.TERRAPULSE_DEMO_MODE:
        logger.info("Demo Mode active: using in-memory databases.")
        return

    try:
        if not firebase_admin._apps:
            if settings.FIREBASE_SERVICE_ACCOUNT:
                cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT)
                firebase_admin.initialize_app(cred, {"projectId": settings.PROJECT_ID})
            else:
                firebase_admin.initialize_app(options={"projectId": settings.PROJECT_ID})
        db = firestore.client()
        logger.info("Firebase Admin successfully initialized.")
    except Exception as e:
        logger.error(f"Error initializing Firebase Admin: {e}. Falling back to in-memory DB.")
        db = None

# Run initialization at import
initialize_firestore()

class FirestoreService:
    @staticmethod
    def get_recent_scans():
        if db:
            try:
                docs = db.collection("scans").order_by("timestamp", direction=firestore.Query.DESCENDING).limit(10).stream()
                return [dict(doc.to_dict(), id=doc.id) for doc in docs]
            except Exception as e:
                logger.error(f"Firestore get_recent_scans error: {e}")
        
        # Fallback in-memory scans
        if "scans" not in in_memory_db:
            in_memory_db["scans"] = [
                { "id": "scan-1", "crop": "Cotton", "diagnosis": "Cotton Leaf Curl Disease", "severity": "High", "timestamp": "2026-08-19T10:00:00Z", "fieldId": "west-field" },
                { "id": "scan-2", "crop": "Wheat", "diagnosis": "Healthy Crop", "severity": "Low", "timestamp": "2026-08-18T14:30:00Z", "fieldId": "north-field" }
            ]
        return in_memory_db["scans"]

    @staticmethod
    def add_scan(scan_data: dict):
        scan_data["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")
        if db:
            try:
                doc_ref = db.collection("scans").document()
                doc_ref.set(scan_data)
                scan_data["id"] = doc_ref.id
                return scan_data
            except Exception as e:
                logger.error(f"Firestore add_scan error: {e}")
        
        scan_data["id"] = str(uuid.uuid4())
        if "scans" not in in_memory_db:
            in_memory_db["scans"] = []
        in_memory_db["scans"].insert(0, scan_data)
        return scan_data

    @staticmethod
    def get_actions():
        if db:
            try:
                docs = db.collection("actions").stream()
                return [dict(doc.to_dict(), id=doc.id) for doc in docs]
            except Exception as e:
                logger.error(f"Firestore get_actions error: {e}")
        return in_memory_db["actions"]

    @staticmethod
    def create_action(action_data: dict):
        action_data["timestamp"] = time.time()
        if db:
            try:
                doc_ref = db.collection("actions").document()
                doc_ref.set(action_data)
                action_data["id"] = doc_ref.id
                return action_data
            except Exception as e:
                logger.error(f"Firestore create_action error: {e}")
        
        action_data["id"] = str(uuid.uuid4())
        in_memory_db["actions"].append(action_data)
        return action_data

    @staticmethod
    def update_action(action_id: str, status: str):
        if db:
            try:
                doc_ref = db.collection("actions").document(action_id)
                doc_ref.update({"status": status})
                return {"id": action_id, "status": status}
            except Exception as e:
                logger.error(f"Firestore update_action error: {e}")

        for act in in_memory_db["actions"]:
            if act["id"] == action_id:
                act["status"] = status
                return act
        return None

    @staticmethod
    def log_feedback(feedback_data: dict):
        feedback_data["timestamp"] = time.time()
        if db:
            try:
                doc_ref = db.collection("feedback").document()
                doc_ref.set(feedback_data)
                feedback_data["id"] = doc_ref.id
                # Auto complete original action
                try:
                    db.collection("actions").document(feedback_data["actionId"]).update({"status": "COMPLETED"})
                except Exception:
                    pass
                return feedback_data
            except Exception as e:
                logger.error(f"Firestore log_feedback error: {e}")

        feedback_data["id"] = str(uuid.uuid4())
        in_memory_db["feedback"].append(feedback_data)
        for act in in_memory_db["actions"]:
            if act["id"] == feedback_data["actionId"]:
                act["status"] = "COMPLETED"
        return feedback_data

    @staticmethod
    def get_farms():
        if db:
            try:
                docs = db.collection("farms").stream()
                farms = []
                for doc in docs:
                    f = doc.to_dict()
                    f["id"] = doc.id
                    f["fields"] = FirestoreService.get_fields_for_farm(doc.id)
                    farms.append(f)
                return farms
            except Exception as e:
                logger.error(f"Firestore get_farms error: {e}")
        
        farms = []
        for f in in_memory_db["farms"]:
            farm_copy = f.copy()
            farm_copy["fields"] = [fld for fld in in_memory_db["fields"] if fld["farm_id"] == f["id"]]
            farms.append(farm_copy)
        return farms

    @staticmethod
    def get_farm(farm_id: str):
        if db:
            try:
                doc = db.collection("farms").document(farm_id).get()
                if doc.exists:
                    f = doc.to_dict()
                    f["id"] = doc.id
                    f["fields"] = FirestoreService.get_fields_for_farm(farm_id)
                    return f
            except Exception as e:
                logger.error(f"Firestore get_farm error: {e}")

        for f in in_memory_db["farms"]:
            if f["id"] == farm_id:
                farm_copy = f.copy()
                farm_copy["fields"] = [fld for fld in in_memory_db["fields"] if fld["farm_id"] == farm_id]
                return farm_copy
        return None

    @staticmethod
    def create_farm(farm_data: dict):
        if db:
            try:
                doc_ref = db.collection("farms").document()
                doc_ref.set(farm_data)
                farm_data["id"] = doc_ref.id
                return farm_data
            except Exception as e:
                logger.error(f"Firestore create_farm error: {e}")
        
        farm_data["id"] = str(uuid.uuid4())
        in_memory_db["farms"].append(farm_data)
        return farm_data

    @staticmethod
    def _map_field_compat(f: dict) -> dict:
        f = dict(f)
        fid = f.get("id")
        
        polygons = {
            "north": [[8.0, 12.0], [44.0, 8.0], [48.0, 38.0], [12.0, 42.0]],
            "south": [[8.0, 50.0], [46.0, 48.0], [50.0, 86.0], [10.0, 88.0]],
            "east": [[56.0, 10.0], [92.0, 14.0], [88.0, 44.0], [58.0, 40.0]],
            "west": [[58.0, 50.0], [94.0, 52.0], [90.0, 88.0], [56.0, 86.0]]
        }
        
        if "name" not in f:
            f["name"] = f.get("location", "Field Parcel") if fid not in polygons else fid.capitalize() + " Field"
        if "acres" not in f:
            f["acres"] = f.get("acreage", 10.0)
        if "health" not in f:
            f["health"] = f.get("health_score", 75.0)
        if "ndvi" not in f:
            f["ndvi"] = 0.41 if fid == "west" else 0.72 if fid == "north" else 0.54 if fid == "south" else 0.63
        if "moisture" not in f:
            f["moisture"] = 22.0 if fid == "west" else 41.0 if fid == "north" else 28.0 if fid == "south" else 35.0
        if "risk" not in f:
            f["risk"] = f.get("risk_level", "LOW").capitalize()
        if "vegetation" not in f:
            h = f["health"]
            f["vegetation"] = "Healthy" if h >= 75 else "Moderate stress" if h >= 55 else "High stress"
        if "stress" not in f:
            h = f["health"]
            f["stress"] = "Low" if h >= 75 else "Medium" if h >= 55 else "High"
        if "soilType" not in f:
            f["soilType"] = f.get("soil_type", "Loamy")
        if "recommendations" not in f or not f["recommendations"]:
            fid_recs = {
                "north": ["Maintain current irrigation schedule", "Monitor for rust fungus in next 2 weeks", "Apply foliar spray at flowering stage"],
                "south": ["Increase irrigation frequency", "Inspect for potassium deficiency", "Introduce cover crop after harvest"],
                "east": ["Apply bio-fertilizer in 10 days", "Maintain pest monitoring traps", "Plan crop rotation with legumes next season"],
                "west": ["Immediate irrigation required", "Test soil for organic matter", "Apply compost amendment", "Consider drought-tolerant cover crop"]
            }
            f["recommendations"] = fid_recs.get(fid, ["Maintain standard crop rotation", "Monitor soil moisture status"])
        if "polygon" not in f or not f["polygon"]:
            f["polygon"] = polygons.get(fid, [[0.0, 0.0], [10.0, 0.0], [10.0, 10.0], [0.0, 10.0]])
            
        return f

    @staticmethod
    def get_fields():
        if db:
            try:
                docs = db.collection("fields").stream()
                return [FirestoreService._map_field_compat(dict(doc.to_dict(), id=doc.id)) for doc in docs]
            except Exception as e:
                logger.error(f"Firestore get_fields error: {e}")
        return [FirestoreService._map_field_compat(f) for f in in_memory_db["fields"]]

    @staticmethod
    def get_field(field_id: str):
        if db:
            try:
                doc = db.collection("fields").document(field_id).get()
                if doc.exists:
                    return FirestoreService._map_field_compat(dict(doc.to_dict(), id=doc.id))
            except Exception as e:
                logger.error(f"Firestore get_field error: {e}")

        for f in in_memory_db["fields"]:
            if f["id"] == field_id:
                return FirestoreService._map_field_compat(f)
        return None

    @staticmethod
    def create_field(field_data: dict):
        if db:
            try:
                doc_ref = db.collection("fields").document()
                doc_ref.set(field_data)
                field_data["id"] = doc_ref.id
                return FirestoreService._map_field_compat(field_data)
            except Exception as e:
                logger.error(f"Firestore create_field error: {e}")

        field_data["id"] = str(uuid.uuid4())
        in_memory_db["fields"].append(field_data)
        return FirestoreService._map_field_compat(field_data)

    @staticmethod
    def update_field(field_id: str, field_data: dict):
        if db:
            try:
                doc_ref = db.collection("fields").document(field_id)
                doc_ref.update(field_data)
                updated = doc_ref.get().to_dict()
                updated["id"] = field_id
                return FirestoreService._map_field_compat(updated)
            except Exception as e:
                logger.error(f"Firestore update_field error: {e}")

        for f in in_memory_db["fields"]:
            if f["id"] == field_id:
                f.update(field_data)
                return FirestoreService._map_field_compat(f)
        return None

    @staticmethod
    def get_fields_for_farm(farm_id: str):
        if db:
            try:
                docs = db.collection("fields").where("farm_id", "==", farm_id).stream()
                return [FirestoreService._map_field_compat(dict(doc.to_dict(), id=doc.id)) for doc in docs]
            except Exception as e:
                logger.error(f"Firestore get_fields_for_farm error: {e}")
        return [FirestoreService._map_field_compat(f) for f in in_memory_db["fields"] if f.get("farm_id") == farm_id]
