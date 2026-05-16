import io
import re
from typing import Optional


def extract_text(content: bytes, filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower()
    if ext == "pdf":
        return _extract_pdf(content)
    elif ext == "docx":
        return _extract_docx(content)
    elif ext in ("csv", "xlsx"):
        return _extract_tabular(content, ext)
    else:
        return content.decode("utf-8", errors="replace")


def _extract_pdf(content: bytes) -> str:
    import fitz
    doc = fitz.open(stream=content, filetype="pdf")
    return "\n\n".join(page.get_text() for page in doc)


def _extract_docx(content: bytes) -> str:
    from docx import Document
    doc = Document(io.BytesIO(content))
    return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())


def _extract_tabular(content: bytes, ext: str) -> str:
    import pandas as pd
    if ext == "csv":
        df = pd.read_csv(io.BytesIO(content))
    else:
        df = pd.read_excel(io.BytesIO(content))
    return df.to_string(index=False)


def chunk_text(text: str, chunk_size: int = 1200, overlap: int = 150) -> list[str]:
    text = re.sub(r"\n{3,}", "\n\n", text.strip())
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        if end < len(text):
            last_break = max(chunk.rfind("\n\n"), chunk.rfind(". "), chunk.rfind("\n"))
            if last_break > chunk_size // 2:
                end = start + last_break + 1
                chunk = text[start:end]
        chunks.append(chunk.strip())
        start = end - overlap
    return [c for c in chunks if c]


async def process_document(doc_id: str, project_id: str, content: bytes, filename: str, db) -> None:
    try:
        text = extract_text(content, filename)
        chunks = chunk_text(text)

        rows = [
            {"document_id": doc_id, "project_id": project_id, "content": chunk, "chunk_index": i}
            for i, chunk in enumerate(chunks)
        ]
        if rows:
            db.table("document_chunks").insert(rows).execute()

        db.table("documents").update({"status": "ready"}).eq("id", doc_id).execute()
    except Exception as e:
        db.table("documents").update({"status": "error"}).eq("id", doc_id).execute()
        raise e
