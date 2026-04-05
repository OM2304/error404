from fastapi import APIRouter, UploadFile, File
import shutil, os

from services.ifc_parser import parse_ifc
from services.clash_engine import detect_clashes
from services.reroute_engine import suggest_reroute

router = APIRouter()

UPLOAD_DIR = "uploads"

@router.post("/upload")
async def upload_ifc(file: UploadFile = File(...)):
    path = f"{UPLOAD_DIR}/{file.filename}"
    
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    elements = parse_ifc(path)
    clashes = detect_clashes(elements)

    for clash in clashes:
        clash["reroute"] = suggest_reroute(clash)

    return {"elements": elements, "clashes": clashes}