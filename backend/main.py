from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import datetime

app = FastAPI(title="AuraSpace OS Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TLEObject(BaseModel):
    norad_id: str
    name: str
    tle_line1: str
    tle_line2: str

import urllib.request
import json

_cached_catalog = None
_cache_time = None

@app.get("/api/v1/catalog")
async def get_catalog():
    """
    Returns active satellite data from CelesTrak.
    Uses a simple cache to avoid spamming the API.
    """
    global _cached_catalog, _cache_time
    now = datetime.datetime.utcnow()
    
    # Return cache if less than 1 hour old
    if _cached_catalog and _cache_time and (now - _cache_time).total_seconds() < 3600:
        return _cached_catalog

    try:
        url = "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            
            # Filter and parse the first 200 items to keep the UI responsive
            catalog = []
            for item in data[:200]:
                catalog.append({
                    "norad_id": str(item.get("NORAD_CAT_ID", "")),
                    "name": item.get("OBJECT_NAME", "UNKNOWN"),
                    "type": item.get("OBJECT_TYPE", "PAYLOAD"),
                    "inclination": item.get("INCLINATION", 0),
                    "apogee": item.get("APOGEE", 0),
                    "perigee": item.get("PERIGEE", 0),
                    "period": item.get("PERIOD", 0),
                    "status": "NOMINAL" if item.get("OBJECT_TYPE") == "PAYLOAD" else "DEAD"
                })
            
            _cached_catalog = catalog
            _cache_time = now
            return catalog
    except Exception as e:
        # Fallback if network fails
        if _cached_catalog:
            return _cached_catalog
        raise HTTPException(status_code=503, detail=f"Failed to fetch catalog from CelesTrak: {str(e)}")

@app.get("/api/v1/tles", response_model=List[TLEObject])
async def get_tles():
    """
    Legacy TLE endpoint (deprecated).
    """
    return []

from cdm_parser import parse_ccsds_cdm
from gemini_agent import evaluate_cdm_with_gemini, generate_triage_rationale
from triage_engine import run_triage_pipeline
import datetime

class RawCDMRequest(BaseModel):
    raw_text: str

# Mocked state for active CDMs
ACTIVE_CDMS = [{
    "message_id": "CDM-2026-0612-A1",
    "creation_date": "2026-06-12T12:00:00Z",
    "tca": "2026-06-14T12:45:32Z",
    "miss_distance": 0.087,
    "relative_velocity": 8.4,
    "collision_probability": 5.653e-4,
    "primary_object": {"name": "AURA-1", "norad_id": "2025-A1-001"},
    "secondary_object": {"name": "COMM SAT VS ROCKET BODY (DEBRIS)", "norad_id": "1098-ROCK-7721"}
}, {
    "message_id": "CDM-2026-0613-B2",
    "creation_date": "2026-06-13T04:00:00Z",
    "tca": "2026-06-14T02:15:00Z",
    "miss_distance": 4.2,
    "relative_velocity": 14.1,
    "collision_probability": 1.2e-6,
    "primary_object": {"name": "ONEWEB-32", "norad_id": "2021-015C"},
    "secondary_object": {"name": "DEBRIS-119", "norad_id": "1999-025J"}
}]

AGENT_ACTIVITY_LOG = [
    {"time": datetime.datetime.utcnow().isoformat() + "Z", "message": "Agent initialized. Monitoring queue."},
]

ESCALATED_IDS = set()

def log_agent_activity(msg: str):
    AGENT_ACTIVITY_LOG.append({
        "time": datetime.datetime.utcnow().isoformat() + "Z",
        "message": msg
    })

@app.post("/api/v1/cdms/ingest")
async def ingest_cdm(request: RawCDMRequest):
    """
    Ingests a raw CCSDS CDM and returns the parsed JSON structure.
    Also stores it in the active alerts list for the UI.
    """
    try:
        log_agent_activity("New conjunction detected via CDM ingest.")
        parsed_data = parse_ccsds_cdm(request.raw_text)
        # Assign a mock ID if not present
        if not parsed_data.get("message_id"):
            parsed_data["message_id"] = f"MOCK-{datetime.datetime.utcnow().timestamp()}"
        ACTIVE_CDMS.append(parsed_data)
        
        log_agent_activity(f"Evaluating threat for {parsed_data['message_id']}.")
        
        return parsed_data
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CDM: {str(e)}")

@app.get("/api/v1/cdms")
@app.get("/api/v1/conjunctions")
async def get_active_cdms():
    """
    Returns the list of active conjunction alerts.
    """
    return ACTIVE_CDMS

@app.get("/api/v1/triage_queue")
async def get_triage_queue():
    """
    Returns the sorted Conjunction Triage Queue.
    """
    queue = []
    for cdm in ACTIVE_CDMS:
        triaged = run_triage_pipeline(dict(cdm))
        queue.append(triaged)
    
    # Sort descending by score
    queue.sort(key=lambda x: x.get("score", 0), reverse=True)

    # Escalation Logic: If a new event enters top 3, log it
    for i, item in enumerate(queue[:3]):
        msg_id = item["message_id"]
        if msg_id not in ESCALATED_IDS:
            ESCALATED_IDS.add(msg_id)
            log_agent_activity(f"Agent Decision: Escalated {msg_id} to Operator Review. Reason: Entered top 3 risk-ranked conjunctions.")

    return queue

@app.get("/api/v1/triage_queue/{message_id}/reasoning")
async def get_triage_reasoning(message_id: str):
    """
    Returns the Gemini explanation for a given triage event.
    """
    target_cdm = next((cdm for cdm in ACTIVE_CDMS if cdm.get("message_id") == message_id), None)
    if not target_cdm:
        raise HTTPException(status_code=404, detail="CDM not found")
        
    # Re-run pipeline to get score and priority, then send to Gemini
    triaged = run_triage_pipeline(dict(target_cdm))
    score = triaged["score"]
    priority = triaged["priority"]

    # This is a slow call, UI should show "Generating..."
    reasoning_lines = generate_triage_rationale(triaged, score, priority)
    return {"reasoning": reasoning_lines}

@app.get("/api/v1/agent_activity")
async def get_agent_activity():
    """
    Returns the log of autonomous agent actions.
    """
    return AGENT_ACTIVITY_LOG

@app.get("/api/v1/cdms/{message_id}/evaluate")
async def evaluate_cdm(message_id: str):
    """
    Evaluates a specific CDM using the Gemini SSA Copilot.
    """
    target_cdm = next((cdm for cdm in ACTIVE_CDMS if cdm.get("message_id") == message_id), None)
    if not target_cdm:
        raise HTTPException(status_code=404, detail="CDM not found")
        
    evaluation = evaluate_cdm_with_gemini(target_cdm)
    return evaluation

@app.get("/api/v1/operations")
async def get_operations():
    """
    Returns upcoming orbital operations and maneuvers.
    """
    now = datetime.datetime.utcnow()
    return [
        {
            "id": "OP-2026-0614-01",
            "type": "COLLISION_AVOIDANCE",
            "asset": "AURA-1",
            "delta_v": "2.45 m/s",
            "scheduled_time": (now + datetime.timedelta(hours=11, minutes=20)).isoformat() + "Z",
            "status": "PENDING_APPROVAL"
        },
        {
            "id": "OP-2026-0615-02",
            "type": "STATION_KEEPING",
            "asset": "AURA-2",
            "delta_v": "0.12 m/s",
            "scheduled_time": (now + datetime.timedelta(days=2)).isoformat() + "Z",
            "status": "SCHEDULED"
        }
    ]

@app.get("/api/v1/reports")
async def get_reports():
    """
    Returns historical maneuver logs and monte carlo debriefs.
    """
    return [
        {
            "id": "REP-2026-05",
            "title": "AURA-1 May 2026 Monthly Debrief",
            "date": "2026-06-01T00:00:00Z",
            "summary": "Executed 2 collision avoidance maneuvers. Expended 4.1 m/s total Delta-V. Overall risk profile maintained below 1e-4 threshold.",
            "tags": ["MONTHLY", "NOMINAL"]
        },
        {
            "id": "REP-2026-0610",
            "title": "Monte Carlo Analysis: 1098-ROCK",
            "date": "2026-06-10T14:30:00Z",
            "summary": "10,000 iterations completed. Highest probability of collision detected at cross-track node. Maneuver executed successfully.",
            "tags": ["ANALYSIS", "ACTION_TAKEN"]
        }
    ]

@app.get("/health")
async def health_check():
    return {"status": "ok", "time": datetime.datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
