from fastapi import FastAPI
from typing import List, Dict, Any

app = FastAPI()

# Sample clash data in the format requested by the user
SAMPLE_CLASHES = {
    "clashes": [
        {
            "element1": "IFC-446949",
            "element2": "IFC-447000",
            "point": [10.5, 20.2, 5.0]
        },
        {
            "element1": "IFC-447120",
            "element2": "IFC-447150",
            "point": [15.2, 22.8, 4.5]
        },
        {
            "element1": "IFC-448200",
            "element2": "IFC-448250",
            "point": [8.7, 18.5, 6.2]
        }
    ]
}

@app.get("/")
def root():
    return {
        "status": "BIM Clash Detection API Running",
        "endpoints": {
            "/clashes": "Get all detected clash results (GET)",
            "/api/analyze": "Perform new clash analysis (POST)"
        }
    }

@app.get("/clashes")
def get_clashes():
    """
    Returns clash results in the requested format:
    { "clashes": [ { "element1": "id1", "element2": "id2", "point": [x, y, z] } ] }
    """
    return SAMPLE_CLASHES

@app.post("/api/analyze")
def analyze_clashes(elements: List[Dict[str, Any]]):
    """
    Placeholder for actual clash detection logic.
    Returns the detected clashes in the requested format.
    """
    # Logic to process elements and find clashes would go here
    return SAMPLE_CLASHES