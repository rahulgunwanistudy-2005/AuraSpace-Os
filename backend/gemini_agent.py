import os
import google.generativeai as genai
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

# Configure the SDK
genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))

SYSTEM_PROMPT = """
You are a Principal Space Situational Awareness (SSA) Specialist advising a satellite operations team.
Analyze the provided Conjunction Data Message (CDM) JSON and provide a highly technical, defensible decision-support brief.
Focus on actual aerospace metrics: Delta-V, Time of Closest Approach (TCA), Miss Distance, and Probability of Collision (Pc).
Do not use fake ML jargon or "AI confidence scores". 
Provide a clear evaluation of maneuver strategies (Radial vs In-Track vs Cross-Track) and their trade-offs in terms of fuel cost vs risk mitigation.
Conclude with a final recommendation (Accept, Monitor, or Execute Maneuver) and a brief technical explanation.
"""

def evaluate_cdm_with_gemini(cdm_json: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sends the parsed CDM JSON to Gemini and retrieves an SSA evaluation.
    """
    prompt = f"Analyze the following Conjunction Data Message (CDM) JSON:\n{cdm_json}"
    
    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=SYSTEM_PROMPT
        )
        response = model.generate_content(prompt)
        return {
            "evaluation": response.text,
            "status": "success"
        }
    except Exception as e:
        return {
            "evaluation": f"Failed to reach Gemini: {str(e)}",
            "status": "error"
        }

def generate_triage_rationale(cdm_json: Dict[str, Any], score: int, priority: str) -> list[str]:
    """
    Takes the deterministic score and priority, and generates a human-readable list of reasons.
    DOES NOT evaluate risk itself; only explains the given score.
    """
    system_instruction="You are an SSA explainer. Given a CDM, its pre-calculated score, and priority, output exactly 3 bullet points explaining why. Do not use Markdown asterisks. Keep it under 10 words per bullet."
    prompt = f"CDM: {cdm_json}\nScore: {score}\nPriority: {priority}"

    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=system_instruction
        )
        response = model.generate_content(prompt)
        text = response.text
    except Exception as e:
        return [f"Gemini evaluation failed: {str(e)}"]
            
    # Parse into a list
    lines = [line.strip("- ").strip() for line in text.split("\n") if line.strip()]
    return lines if len(lines) > 0 else ["Could not generate reasoning."]
