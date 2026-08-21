import logging
from pymongo import MongoClient
from app.config import settings

logger = logging.getLogger("TerraPulseBackend.MongoDB")

# Global client and database
client = None
db = None

def initialize_mongodb():
    global client, db
    if not settings.MONGODB_URI:
        logger.warning("MONGODB_URI is not set. MongoDB operations will be mocked / unavailable.")
        return

    try:
        logger.info("Initializing MongoDB connection...")
        client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
        # Force a connection check
        client.admin.command('ping')
        db = client["terrapulse"]
        logger.info("MongoDB Atlas successfully connected.")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB Atlas: {e}")
        client = None
        db = None

# Initialize connection on load
initialize_mongodb()

class MongoDBService:
    @staticmethod
    def get_user_profile(uid: str) -> dict:
        if db is None:
            logger.warning("MongoDB not initialized. Returning mock user profile.")
            return {
                "uid": uid,
                "email": "farmer@terrapulse.org",
                "displayName": "Demo Farmer",
                "farmName": "Green Valley Farm",
                "location": "Pune, Maharashtra",
                "acreage": 30
            }
        try:
            user = db.users.find_one({"uid": uid})
            if user:
                user["_id"] = str(user["_id"])  # Convert ObjectId to string for JSON serialization
                return user
            return None
        except Exception as e:
            logger.error(f"Error fetching user profile from MongoDB: {e}")
            return None

    @staticmethod
    def create_user_profile(uid: str, email: str, display_name: str) -> dict:
        default_profile = {
            "uid": uid,
            "email": email,
            "displayName": display_name or "Farmer",
            "farmName": "My TerraPulse Farm",
            "location": "Pune, Maharashtra",
            "acreage": 10
        }
        if db is None:
            logger.warning("MongoDB not initialized. Mocking create user profile.")
            return default_profile

        try:
            # Check if user already exists
            existing = db.users.find_one({"uid": uid})
            if existing:
                existing["_id"] = str(existing["_id"])
                return existing

            db.users.insert_one(default_profile.copy())
            logger.info(f"Created new user profile in MongoDB for uid: {uid}")
            return default_profile
        except Exception as e:
            logger.error(f"Error creating user profile in MongoDB: {e}")
            return default_profile

    @staticmethod
    def update_user_profile(uid: str, profile_data: dict) -> dict:
        if db is None:
            logger.warning("MongoDB not initialized. Mocking update user profile.")
            return profile_data

        try:
            # Filter out restricted fields
            updatable = {
                k: v for k, v in profile_data.items()
                if k in ["displayName", "farmName", "location", "acreage"]
            }
            # Type cast acreage
            if "acreage" in updatable:
                try:
                    updatable["acreage"] = float(updatable["acreage"])
                except ValueError:
                    pass

            db.users.update_one({"uid": uid}, {"$set": updatable}, upsert=True)
            logger.info(f"Updated MongoDB user profile for uid: {uid}")
            updated = db.users.find_one({"uid": uid})
            if updated:
                updated["_id"] = str(updated["_id"])
                return updated
            return profile_data
        except Exception as e:
            logger.error(f"Error updating user profile in MongoDB: {e}")
            return profile_data
