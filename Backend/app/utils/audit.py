import os
import json
import time
import logging
from datetime import datetime

logger = logging.getLogger("TerraPulseBackend.Audit")

AUDIT_LOG_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "ai_audit_logs.jsonl")

class AIAuditor:
    @staticmethod
    def log_operation(
        model: str,
        feature: str,
        field_id: str,
        schema_version: str,
        latency_ms: float,
        success: bool,
        error_message: str = ""
    ):
        audit_record = {
            "model": model,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "feature_version": "v1.0.0",
            "feature": feature,
            "input_field_id": field_id,
            "output_schema_version": schema_version,
            "latency_ms": round(latency_ms, 2),
            "success": success,
            "error_message": error_message
        }
        
        try:
            # Append to jsonl file
            with open(AUDIT_LOG_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps(audit_record) + "\n")
            logger.info(f"AI Audit logged: {feature} | model: {model} | success: {success} | latency: {latency_ms:.2f}ms")
        except Exception as e:
            logger.error(f"Failed to write to AI audit log file: {e}")
            
        # Optional: attempt to save to firestore as well (non-blocking)
        try:
            from app.services.firestore_service import FirestoreService
            # We can log to a subcollection or collection if firestore is ready
            # Since FirestoreService has in-memory fallback, this is safe and will not block
            db = FirestoreService._get_db()
            if db:
                db.collection("ai_audit_logs").add(audit_record)
        except Exception:
            pass
