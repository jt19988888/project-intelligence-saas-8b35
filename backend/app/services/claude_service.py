import anthropic
from app.config import settings

client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

SYSTEM_PROMPT = """You are an expert project intelligence assistant. You analyze project documents, identify risks, and answer questions about project plans, timelines, budgets, and requirements.

When answering:
- Be concise and specific — cite the source document when relevant
- If you identify risks or issues, highlight them clearly
- For structured data (CSV/XLSX), interpret the data meaningfully
- If the provided context doesn't contain enough information to answer confidently, say so

You have access to project documents provided in the context below."""


def search_chunks(project_id: str, query: str, db, top_k: int = 6) -> list[dict]:
    result = (
        db.table("document_chunks")
        .select("id, content, document_id, documents(name)")
        .eq("project_id", project_id)
        .text_search("content", query, config="english")
        .limit(top_k)
        .execute()
    )
    return result.data or []


def build_context(chunks: list[dict]) -> str:
    if not chunks:
        return "No relevant documents found in this project."
    parts = []
    for i, chunk in enumerate(chunks):
        doc_name = chunk.get("documents", {}).get("name", "Unknown") if isinstance(chunk.get("documents"), dict) else "Unknown"
        parts.append(f"[Source {i+1}: {doc_name}]\n{chunk['content']}")
    return "\n\n---\n\n".join(parts)


async def stream_chat_response(
    project_id: str,
    messages: list[dict],
    query: str,
    db,
):
    chunks = search_chunks(project_id, query, db)
    context = build_context(chunks)

    sources = []
    for c in chunks:
        doc_name = c.get("documents", {}).get("name", "Unknown") if isinstance(c.get("documents"), dict) else "Unknown"
        sources.append({
            "document_id": c["document_id"],
            "document_name": doc_name,
            "chunk": c["content"][:200] + "..." if len(c["content"]) > 200 else c["content"],
        })

    system = f"{SYSTEM_PROMPT}\n\n<project_documents>\n{context}\n</project_documents>"

    with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        system=system,
        messages=messages,
    ) as stream:
        for text in stream.text_stream:
            yield {"type": "text", "text": text}

    yield {"type": "done", "sources": sources}
