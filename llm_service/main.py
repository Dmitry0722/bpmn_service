import os
import sys

if sys.platform.startswith('linux'):
    try:
        __import__('pysqlite3')
        sys.modules['sqlite3'] = sys.modules.pop('pysqlite3')
    except ImportError:
        pass

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from services.rag_service import RAGService
from services.llm_service import LLMService
from dotenv import load_dotenv

load_dotenv(".env.local") 
load_dotenv()

app = FastAPI(title="BPMN Architect AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

rag = None
llm = None

@app.on_event("startup")
async def startup_event():
    global rag, llm
    try:
        rag = RAGService()
        llm = LLMService()
    except Exception as e:
        print(f" Initialization Error: {e}")

class AnalyzeRequest(BaseModel):
    document_text: str
    context_text: str = ""

@app.post("/api/analyze")
async def analyze_document(request: AnalyzeRequest):
    if not llm:
        raise HTTPException(status_code=503, detail="LLM Service not initialized")
    
    try:
        rag_context = ""
        if rag:
            rag_context = rag.query(request.document_text)
        
        result = await llm.analyze_requirements(
            doc_text=request.document_text,
            rag_context=rag_context,
            user_context=request.context_text
        )
        
        return result
        
    except Exception as e:
        print(f"Error processing request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "BPMN Architect AI"}

current_dir = os.path.dirname(os.path.abspath(__file__))
dist_dir = os.path.join(current_dir, "dist")

if os.path.exists(dist_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_dir, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        file_path = os.path.join(dist_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(dist_dir, "index.html"))
else:
    @app.get("/")
    async def root_warning():
        return {
            "error": "Frontend build not found.", 
            "message": "Please run 'npm run build' inside the bpmn-architect-ai directory to generate the frontend files."
        }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
