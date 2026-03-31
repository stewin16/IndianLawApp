"""
LegalAi RAG Service - Groq Powered
"""
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
from typing import Optional, List
from rag_engine import RAGEngine
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="LegalAi RAG Service - Groq Powered")

# Initialize RAG Engine
rag = RAGEngine()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str
    language: str = "en"
    session_id: Optional[str] = None
    arguments_mode: bool = False
    analysis_mode: bool = False

@app.on_event("startup")
async def startup_event():
    print("\n" + "="*60)
    print("LEGAL AI SERVICE - INITIALIZED (GROQ POWERED)")
    print("="*60 + "\n")

@app.get("/")
def read_root():
    return {"status": "ok", "service": "LegalAi Service", "mode": "Groq-RAG"}

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "engine": "RAG-ready",
        "llm": "Groq (llama-3.3-70b)"
    }

@app.post("/query")
async def query_rag(request: QueryRequest):
    try:
        result = await rag.query(
            request.query, 
            language=request.language,
            arguments_mode=request.arguments_mode,
            analysis_mode=request.analysis_mode,
            session_id=request.session_id
        )
        return result
    except Exception as e:
        print(f"[API] Query Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/summarize")
async def summarize_document(file: UploadFile = File(...)):
    try:
        content = await file.read()
        summary = await rag.summarize(content, file.filename)
        return {"summary": summary, "filename": file.filename}
    except Exception as e:
        print(f"[API] Summarize Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/draft")
async def draft_document(draft_type: str = Form(...), details: str = Form(...), language: str = Form("en")):
    try:
        draft = rag.generate_draft(draft_type, details, language=language)
        return {"draft": draft}
    except Exception as e:
        print(f"[API] Drafting Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Get port from env for deployment compatibility
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
