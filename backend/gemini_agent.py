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
    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=SYSTEM_PROMPT
        )
        
        prompt = f"Analyze the following Conjunction Data Message (CDM) JSON:\n{cdm_json}"
        
        response = model.generate_content(prompt)
        
        # In a production app, we would parse structured JSON from the model,
        # but for this demo, we return the text explanation.
        return {
            "evaluation": response.text,
            "status": "success"
        }
    except Exception as e:
        return {
            "evaluation": f"Failed to reach Gemini SSA Copilot: {str(e)}",
            "status": "error"
        }
