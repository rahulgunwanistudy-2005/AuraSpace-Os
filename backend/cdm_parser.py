import re
from typing import Dict, Any

def parse_ccsds_cdm(raw_text: str) -> Dict[str, Any]:
    """
    Parses a standard CCSDS Conjunction Data Message (CDM) in KVP format.
    Extracts essential information required for AuraSpace OS.
    """
    result = {
        "message_id": "",
        "creation_date": "",
        "tca": "",
        "miss_distance": 0.0,
        "relative_velocity": 0.0,
        "collision_probability": 0.0,
        "primary_object": {"name": "", "norad_id": ""},
        "secondary_object": {"name": "", "norad_id": ""}
    }

    # Extract generic metadata
    msg_id_match = re.search(r"MESSAGE_ID\s*=\s*(.+)", raw_text)
    if msg_id_match: result["message_id"] = msg_id_match.group(1).strip()
    
    tca_match = re.search(r"TCA\s*=\s*(.+)", raw_text)
    if tca_match: result["tca"] = tca_match.group(1).strip()
    
    miss_dist_match = re.search(r"MISS_DISTANCE\s*=\s*([0-9.]+)", raw_text)
    if miss_dist_match: result["miss_distance"] = float(miss_dist_match.group(1))

    rel_vel_match = re.search(r"RELATIVE_VELOCITY\s*=\s*([0-9.]+)", raw_text)
    if rel_vel_match: result["relative_velocity"] = float(rel_vel_match.group(1))

    col_prob_match = re.search(r"COLLISION_PROBABILITY\s*=\s*([0-9.Ee+-]+)", raw_text)
    if col_prob_match: result["collision_probability"] = float(col_prob_match.group(1))

    # We expect OBJECT_NAME to appear twice (Object 1 and Object 2)
    obj_names = re.findall(r"OBJECT_NAME\s*=\s*(.+)", raw_text)
    if len(obj_names) >= 2:
        result["primary_object"]["name"] = obj_names[0].strip()
        result["secondary_object"]["name"] = obj_names[1].strip()

    obj_ids = re.findall(r"OBJECT_DESIGNATOR\s*=\s*(.+)", raw_text)
    if len(obj_ids) >= 2:
        result["primary_object"]["norad_id"] = obj_ids[0].strip()
        result["secondary_object"]["norad_id"] = obj_ids[1].strip()

    return result
