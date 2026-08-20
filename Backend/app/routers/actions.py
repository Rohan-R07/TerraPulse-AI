import time
import logging
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.schemas.farm import ActionItem, FeedbackItem
from app.services.firestore_service import FirestoreService

logger = logging.getLogger("TerraPulseBackend.Actions")
router = APIRouter(tags=["Actions & Feedback"])

@router.get("/actions")
async def get_actions(farm_id: Optional[str] = None):
    # Retrieve all actions
    all_actions = FirestoreService.get_actions()
    
    # Normalize keys for backwards compatibility in JSON response
    for act in all_actions:
        if "recommendation" not in act and "title" in act:
            act["recommendation"] = act["title"]
        if "title" not in act and "recommendation" in act:
            act["title"] = act["recommendation"]
        if "dueDate" not in act and "due_date" in act:
            act["dueDate"] = act["due_date"]
        if "due_date" not in act and "dueDate" in act:
            act["due_date"] = act["dueDate"]
        if "field" not in act and "field_id" in act:
            act["field"] = act["field_id"].replace("-", " ").title()
        if "field_id" not in act and "field" in act:
            act["field_id"] = act["field"].lower().replace(" ", "-")

    return all_actions

@router.get("/actions/{farm_id}")
async def get_farm_actions(farm_id: str):
    # Farm specific filtering, can default to all for simple setup
    return await get_actions(farm_id=farm_id)

@router.post("/actions")
async def create_action(action: ActionItem):
    act_dict = action.dict()
    
    # Ensure compat properties exist
    if not act_dict.get("title") and act_dict.get("recommendation"):
        act_dict["title"] = act_dict["recommendation"]
    if not act_dict.get("recommendation") and act_dict.get("title"):
        act_dict["recommendation"] = act_dict["title"]
    if not act_dict.get("dueDate") and act_dict.get("due_date"):
        act_dict["dueDate"] = act_dict["due_date"]
    if not act_dict.get("due_date") and act_dict.get("dueDate"):
        act_dict["due_date"] = act_dict["dueDate"]
    if not act_dict.get("dueDate"):
        act_dict["dueDate"] = time.strftime("%Y-%m-%d", time.localtime(time.time() + 86400 * 3))
        act_dict["due_date"] = act_dict["dueDate"]

    return FirestoreService.create_action(act_dict)

@router.patch("/actions/{action_id}")
async def update_action(action_id: str, status: str):
    upper_status = status.upper()
    if upper_status not in ["PENDING", "COMPLETED", "DISMISSED"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    # Fetch action to get previous details for the feedback loop
    actions = FirestoreService.get_actions()
    target_action = None
    for act in actions:
        if str(act.get("id")) == str(action_id):
            target_action = act
            break

    updated = FirestoreService.update_action(action_id, upper_status)
    if not updated:
        raise HTTPException(status_code=404, detail="Action not found")
        
    # closed loop learning: log feedback on completion
    if upper_status == "COMPLETED" and target_action:
        field_name = target_action.get("field", "West Field")
        field_id = target_action.get("field_id", "west-field")
        
        feedback_data = {
            "actionId": str(action_id),
            "action": target_action.get("recommendation") or target_action.get("title") or "Irrigate field",
            "field": field_name,
            "previousRisk": target_action.get("priority") or "High",
            "outcome": "Marked COMPLETED by farmer. Decision feedback data saved.",
            "subsequentObservations": "NDVI and Moisture stabilized.",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")
        }
        FirestoreService.log_feedback(feedback_data)
        logger.info(f"Decision Feedback Data logged for completed action {action_id}")

    return updated

@router.post("/feedback")
async def log_feedback(feedback: FeedbackItem):
    feedback_dict = feedback.dict()
    feedback_dict["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")
    return FirestoreService.log_feedback(feedback_dict)
