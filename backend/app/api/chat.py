import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from app.dependencies import get_current_user, get_supabase
from app.services.claude_service import stream_chat_response

router = APIRouter()


class SessionCreate(BaseModel):
    project_id: str
    title: Optional[str] = None


class MessageCreate(BaseModel):
    content: str
    project_id: str


@router.post("/sessions")
async def create_session(body: SessionCreate, user=Depends(get_current_user), db=Depends(get_supabase)):
    session = db.table("chat_sessions").insert({
        "project_id": body.project_id,
        "user_id": user["id"],
        "title": body.title,
    }).execute().data[0]
    return session


@router.get("/sessions")
async def list_sessions(project_id: str, user=Depends(get_current_user), db=Depends(get_supabase)):
    result = (
        db.table("chat_sessions")
        .select("*")
        .eq("project_id", project_id)
        .eq("user_id", user["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.get("/sessions/{session_id}/messages")
async def get_messages(session_id: str, user=Depends(get_current_user), db=Depends(get_supabase)):
    session = db.table("chat_sessions").select("*").eq("id", session_id).eq("user_id", user["id"]).execute()
    if not session.data:
        raise HTTPException(403, "Session not found")
    result = db.table("chat_messages").select("*").eq("session_id", session_id).order("created_at").execute()
    return result.data or []


@router.post("/sessions/{session_id}/messages")
async def send_message(
    session_id: str,
    body: MessageCreate,
    user=Depends(get_current_user),
    db=Depends(get_supabase),
):
    session = db.table("chat_sessions").select("*").eq("id", session_id).eq("user_id", user["id"]).execute()
    if not session.data:
        raise HTTPException(403, "Session not found")

    db.table("chat_messages").insert({
        "session_id": session_id,
        "role": "user",
        "content": body.content,
    }).execute()

    history = db.table("chat_messages").select("role, content").eq("session_id", session_id).order("created_at").execute().data or []
    messages = [{"role": m["role"], "content": m["content"]} for m in history]

    full_response = []

    async def generate():
        async for chunk in stream_chat_response(body.project_id, messages, body.content, db):
            if chunk["type"] == "text":
                full_response.append(chunk["text"])
            yield f"data: {json.dumps(chunk)}\n\n"

        assistant_content = "".join(full_response)
        db.table("chat_messages").insert({
            "session_id": session_id,
            "role": "assistant",
            "content": assistant_content,
        }).execute()

    return StreamingResponse(generate(), media_type="text/event-stream")
