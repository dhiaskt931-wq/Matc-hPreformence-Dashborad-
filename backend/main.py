from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from services.match_service import get_match_data

app = FastAPI(title="Football Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/match/{match_id}")
def match(match_id: int):
    try:
        return get_match_data(match_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}
