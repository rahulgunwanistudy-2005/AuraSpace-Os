from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
try:
    from google import genai
    from google.genai import types
except ImportError:
    pass # Will handle gracefully if not installed

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScenarioData(BaseModel):
    name: str
    basePc: float
    tier: str

class AnalyzeRequest(BaseModel):
    scenario: ScenarioData

@app.post("/api/analyze")
async def analyze_conjunction(request: AnalyzeRequest):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        # Fallback to mock data if no API key is provided
        return {
            "reasoning_steps": [
                "API Key missing, using mock reasoning...",
                "Analyzing relative motion...",
                "Evaluating collision geometry...",
                "Computing maneuver candidates...",
                "Estimating fuel cost...",
                "Selecting optimal strategy..."
            ],
            "strategies": [
                {"id": "no-action", "name": "No Action", "deltaV": 0, "fuelCost": "0", "newPc": request.scenario.basePc, "recommendation": "Reject", "explanation": "Collision risk is unacceptable."},
                {"id": "radial", "name": "Radial", "deltaV": 0.4, "fuelCost": "Low", "newPc": 8.2e-7, "recommendation": "Best", "explanation": "Radial Burn selected because it reduces collision probability by 99.98% while consuming 43% less fuel."},
                {"id": "in-track", "name": "In-Track", "deltaV": 0.7, "fuelCost": "Medium", "newPc": 1.2e-6, "recommendation": "Accept", "explanation": "Viable alternative, but consumes more fuel than radial burn."},
            ]
        }

    try:
        client = genai.Client(api_key=api_key)
        
        prompt = f"""
        You are an elite Aerospace Conjunction Triage Copilot AI.
        Analyze the following orbital conjunction scenario:
        Name: {request.scenario.name}
        Base Probability of Collision (Pc): {request.scenario.basePc}
        Threat Tier: {request.scenario.tier}
        
        Generate exactly 5 reasoning steps explaining your analysis process.
        Generate 3 maneuver strategies: 'No Action', 'Radial', and 'In-Track'.
        For each strategy, provide a realistic Delta-V (m/s), Fuel Cost (Low/Medium/High/0), the new mitigated Pc, a recommendation tag (Reject/Best/Accept/Monitor), and a technical 1-sentence explanation.
        """

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema={
                    "type": "OBJECT",
                    "properties": {
                        "reasoning_steps": {
                            "type": "ARRAY",
                            "items": {"type": "STRING"}
                        },
                        "strategies": {
                            "type": "ARRAY",
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "id": {"type": "STRING"},
                                    "name": {"type": "STRING"},
                                    "deltaV": {"type": "NUMBER"},
                                    "fuelCost": {"type": "STRING"},
                                    "newPc": {"type": "NUMBER"},
                                    "recommendation": {"type": "STRING"},
                                    "explanation": {"type": "STRING"}
                                },
                                "required": ["id", "name", "deltaV", "fuelCost", "newPc", "recommendation", "explanation"]
                            }
                        }
                    },
                    "required": ["reasoning_steps", "strategies"]
                },
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error during LLM generation: {e}")
        raise HTTPException(status_code=500, detail=str(e))
