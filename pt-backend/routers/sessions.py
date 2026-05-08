import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from database import get_db_conn
from services.auth_service import get_current_user
from typing import List, Optional

router = APIRouter()

class SessionSaveRequest(BaseModel):
    id: str
    session_date: str
    raw_story: str
    data: dict

class ReflectionRequest(BaseModel):
    notes: str

@router.post("")
async def save_session(req: SessionSaveRequest, user: dict = Depends(get_current_user)):
    with get_db_conn() as conn:
        cursor = conn.cursor()
        
        # Check if exists (update if so)
        cursor.execute("SELECT id FROM sessions WHERE id = ? AND user_id = ?", (req.id, user["id"]))
        exists = cursor.fetchone()
        
        if exists:
            cursor.execute(
                "UPDATE sessions SET session_date = ?, raw_story = ?, data = ? WHERE id = ?",
                (req.session_date, req.raw_story, json.dumps(req.data), req.id)
            )
        else:
            cursor.execute(
                "INSERT INTO sessions (id, user_id, session_date, raw_story, data) VALUES (?, ?, ?, ?, ?)",
                (req.id, user["id"], req.session_date, req.raw_story, json.dumps(req.data))
            )
            
        conn.commit()
    return {"success": True}

@router.get("")
async def list_sessions(user: dict = Depends(get_current_user)):
    with get_db_conn() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, session_date, raw_story, data, reflection_notes FROM sessions WHERE user_id = ? ORDER BY session_date DESC", (user["id"],))
        rows = cursor.fetchall()
        
        sessions = []
        for r in rows:
            sessions.append({
                "id": r["id"],
                "session_date": r["session_date"],
                "raw_story": r["raw_story"],
                "data": json.loads(r["data"]),
                "reflection_notes": r["reflection_notes"]
            })
    return sessions

@router.put("/{session_id}/notes")
async def update_notes(session_id: str, req: ReflectionRequest, user: dict = Depends(get_current_user)):
    with get_db_conn() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE sessions SET reflection_notes = ? WHERE id = ? AND user_id = ?", (req.notes, session_id, user["id"]))
        conn.commit()
    return {"success": True}
