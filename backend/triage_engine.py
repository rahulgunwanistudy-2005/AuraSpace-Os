import datetime
import math

ASSET_WEIGHTS = {
    "MISSION_CRITICAL": 1.0,
    "OPERATIONAL": 0.8,
    "COMMERCIAL": 0.6,
    "SCIENTIFIC": 0.5,
    "INACTIVE": 0.3,
    "DEBRIS": 0.1
}

def classify_asset(name: str) -> str:
    name = name.upper()
    if "AURA" in name:
        return "MISSION_CRITICAL"
    elif "STARLINK" in name or "ONEWEB" in name:
        return "OPERATIONAL"
    elif "COMM" in name:
        return "COMMERCIAL"
    elif "NOAA" in name or "GOES" in name:
        return "SCIENTIFIC"
    elif "ROCKET BODY" in name or "R/B" in name:
        return "INACTIVE"
    elif "DEBRIS" in name:
        return "DEBRIS"
    return "OPERATIONAL" # Default fallback

def calculate_threat_score(cdm: dict) -> int:
    """
    Deterministic Threat Scoring Engine.
    Calculates a 0-100 score based on weighted risk parameters.
    """
    pc = cdm.get("collision_probability", 0)
    miss_distance = cdm.get("miss_distance", 1000)
    
    tca_str = cdm.get("tca", "")
    hours_to_tca = 100
    try:
        if tca_str:
            tca_time = datetime.datetime.fromisoformat(tca_str.replace("Z", "+00:00"))
            now = datetime.datetime.now(datetime.timezone.utc)
            delta = tca_time - now
            hours_to_tca = max(0, delta.total_seconds() / 3600)
    except:
        hours_to_tca = 12

    velocity = cdm.get("relative_velocity", 0)
    primary_name = cdm.get("primary_object", {}).get("name", "")
    
    asset_class = classify_asset(primary_name)
    asset_weight = ASSET_WEIGHTS.get(asset_class, 0.5)

    # 1. Pc Score (35%)
    pc_score = 0
    if pc > 0:
        log_pc = math.log10(pc)
        if log_pc >= -3:
            pc_score = 35
        elif log_pc <= -7:
            pc_score = 0
        else:
            pc_score = ((log_pc + 7) / 4) * 35

    # 2. Miss Distance Score (20%)
    dist_score = 0
    if miss_distance <= 0.1:
        dist_score = 20
    elif miss_distance >= 5:
        dist_score = 0
    else:
        dist_score = 20 * (1 - (miss_distance - 0.1) / 4.9)

    # 3. Time To TCA Score (20%)
    tca_score = 0
    if hours_to_tca <= 2:
        tca_score = 20
    elif hours_to_tca >= 72:
        tca_score = 0
    else:
        tca_score = 20 * (1 - (hours_to_tca - 2) / 70)

    # 4. Asset Importance Score (15%)
    asset_score = asset_weight * 15

    # 5. Velocity Score (10%)
    vel_score = 0
    if velocity >= 15:
        vel_score = 10
    elif velocity <= 1:
        vel_score = 0
    else:
        vel_score = 10 * ((velocity - 1) / 14)

    total_score = pc_score + dist_score + tca_score + asset_score + vel_score
    return min(100, max(0, int(total_score)))


def assign_priority(score: int) -> str:
    if score >= 90:
        return "CRITICAL"
    elif score >= 70:
        return "HIGH"
    elif score >= 40:
        return "MEDIUM"
    return "LOW"


def assign_recommended_action(priority: str) -> str:
    if priority == "CRITICAL":
        return "Immediate Review & Plan Maneuver"
    elif priority == "HIGH":
        return "Operator Review Required"
    elif priority == "MEDIUM":
        return "Monitor Trajectory"
    return "Archive"


def run_triage_pipeline(cdm: dict) -> dict:
    score = calculate_threat_score(cdm)
    priority = assign_priority(score)
    
    cdm["score"] = score
    cdm["priority"] = priority
    cdm["recommended_action"] = assign_recommended_action(priority)
    
    # Do NOT generate reasoning here. That is done via Gemini endpoint asynchronously.
    # We strip reasoning here if it exists so UI shows "Generating..."
    if "reasoning" in cdm:
        del cdm["reasoning"]
        
    cdm["data_confidence"] = "HIGH"
    cdm["data_source"] = "Latest CDM"
    cdm["data_updated_ago"] = "3 min ago"
    
    return cdm
