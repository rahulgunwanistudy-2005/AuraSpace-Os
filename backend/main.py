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

# Mocked TLE Database for Phase 1
MOCK_TLES = [
    TLEObject(
        norad_id="25544",
        name="ISS (ZARYA)",
        tle_line1="1 25544U 98067A   26161.50000000  .00010000  00000-0  10000-3 0  9998",
        tle_line2="2 25544  51.6400  10.0000 0001000  20.0000 340.0000 15.50000000000001"
    ),
    TLEObject(
        norad_id="43013",
        name="NOAA 20",
        tle_line1="1 43013U 17073A   26161.50000000  .00000100  00000-0  10000-4 0  9998",
        tle_line2="2 43013  98.7000  20.0000 0001000  30.0000 330.0000 14.20000000000001"
    )
]

@app.get("/api/v1/tles", response_model=List[TLEObject])
async def get_tles():
    """
    Returns active TLEs for the catalog.
    """
    return MOCK_TLES

from cdm_parser import parse_ccsds_cdm
from gemini_agent import evaluate_cdm_with_gemini
import datetime

class RawCDMRequest(BaseModel):
    raw_text: str

# Mocked state for active CDMs
ACTIVE_CDMS = [{
    "message_id": "CDM-2026-0612-A1",
    "creation_date": "2026-06-12T12:00:00Z",
    "tca": "2026-06-14T18:30:00Z",
    "miss_distance": 421.0,
    "relative_velocity": 8.4,
    "collision_probability": 0.000211,
    "primary_object": {"name": "AURA-1", "norad_id": "2025-A1-001"},
    "secondary_object": {"name": "DEBRIS-ROCK-7721", "norad_id": "1998-ROCK-7721"}
}]

@app.post("/api/v1/cdms/ingest")
async def ingest_cdm(request: RawCDMRequest):
    """
    Ingests a raw CCSDS CDM and returns the parsed JSON structure.
    Also stores it in the active alerts list for the UI.
    """
    try:
        parsed_data = parse_ccsds_cdm(request.raw_text)
        # Assign a mock ID if not present
        if not parsed_data.get("message_id"):
            parsed_data["message_id"] = f"MOCK-{datetime.datetime.utcnow().timestamp()}"
        ACTIVE_CDMS.append(parsed_data)
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

@app.get("/health")
async def health_check():
    return {"status": "ok", "time": datetime.datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
