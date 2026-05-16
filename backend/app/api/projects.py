from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional
from app.dependencies import get_current_user, get_supabase
from app.services.document_processor import process_document
import asyncio

router = APIRouter()


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None


@router.get("")
async def list_projects(user=Depends(get_current_user), db=Depends(get_supabase)):
    result = (
        db.table("projects")
        .select("*, project_members!inner(user_id)")
        .eq("project_members.user_id", user["id"])
        .order("created_at", desc=True)
        .execute()
    )
    projects = result.data or []
    for p in projects:
        p.pop("project_members", None)
        doc_count = db.table("documents").select("id", count="exact").eq("project_id", p["id"]).execute()
        member_count = db.table("project_members").select("id", count="exact").eq("project_id", p["id"]).execute()
        p["document_count"] = doc_count.count or 0
        p["member_count"] = member_count.count or 0
    return projects


@router.post("")
async def create_project(body: ProjectCreate, user=Depends(get_current_user), db=Depends(get_supabase)):
    project = db.table("projects").insert({
        "name": body.name,
        "description": body.description,
        "created_by": user["id"],
    }).execute().data[0]

    db.table("project_members").insert({
        "project_id": project["id"],
        "user_id": user["id"],
        "role": "admin",
    }).execute()

    project["document_count"] = 0
    project["member_count"] = 1
    return project


@router.get("/{project_id}")
async def get_project(project_id: str, user=Depends(get_current_user), db=Depends(get_supabase)):
    _assert_member(db, project_id, user["id"])
    result = db.table("projects").select("*").eq("id", project_id).single().execute()
    if not result.data:
        raise HTTPException(404, "Project not found")
    return result.data


@router.get("/{project_id}/documents")
async def list_documents(project_id: str, user=Depends(get_current_user), db=Depends(get_supabase)):
    _assert_member(db, project_id, user["id"])
    result = db.table("documents").select("*").eq("project_id", project_id).order("created_at", desc=True).execute()
    return result.data or []


@router.post("/{project_id}/documents")
async def upload_document(
    project_id: str,
    file: UploadFile = File(...),
    user=Depends(get_current_user),
    db=Depends(get_supabase),
):
    _assert_member(db, project_id, user["id"])

    content = await file.read()
    storage_path = f"{project_id}/{file.filename}"

    db.storage.from_("documents").upload(storage_path, content, {"content-type": file.content_type or "application/octet-stream"})

    doc = db.table("documents").insert({
        "project_id": project_id,
        "name": file.filename,
        "file_path": storage_path,
        "file_type": file.filename.rsplit(".", 1)[-1].lower(),
        "size_bytes": len(content),
        "status": "processing",
        "uploaded_by": user["id"],
    }).execute().data[0]

    asyncio.create_task(process_document(doc["id"], project_id, content, file.filename, db))

    return doc


@router.delete("/{project_id}/documents/{doc_id}")
async def delete_document(project_id: str, doc_id: str, user=Depends(get_current_user), db=Depends(get_supabase)):
    _assert_member(db, project_id, user["id"])
    doc = db.table("documents").select("file_path").eq("id", doc_id).single().execute().data
    if doc:
        try:
            db.storage.from_("documents").remove([doc["file_path"]])
        except Exception:
            pass
    db.table("document_chunks").delete().eq("document_id", doc_id).execute()
    db.table("documents").delete().eq("id", doc_id).execute()
    return {"ok": True}


def _assert_member(db, project_id: str, user_id: str):
    result = db.table("project_members").select("id").eq("project_id", project_id).eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(403, "Not a member of this project")
