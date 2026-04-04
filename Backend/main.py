from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ifc_parser import parse_ifc
from clash_engine import detect_clashes

app = FastAPI()

# Allow frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/clashes")
def get_clashes():
    elements = parse_ifc("sample.ifc")
    clashes = detect_clashes(elements)
    return clashes

@app.get("/ask")
def ask():
    return {"response": "Real IFC-based clash detection completed."}