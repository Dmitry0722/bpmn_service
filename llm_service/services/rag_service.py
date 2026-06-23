import os
import json
from dotenv import load_dotenv
import chromadb
from chromadb.utils import embedding_functions

load_dotenv(".env.local")
load_dotenv()

os.environ["ANONYMIZED_TELEMETRY"] = "False"

class RAGService:
    def __init__(self):
        try:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            db_path = os.path.join(base_dir, "../chroma_db")
            
            if not os.path.exists(db_path):
                os.makedirs(db_path)

            self.client = chromadb.PersistentClient(path=db_path)

            self.embed_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
                model_name="paraphrase-multilingual-MiniLM-L12-v2"
            )

            self.collection = self.client.get_or_create_collection(
                name="bpmn_knowledge_base", 
                embedding_function=self.embed_fn
            )
            
            # Seed if empty
            if self.collection.count() == 0:
                self._seed_knowledge()
                
        except Exception as e:
            print(f" RAG Initialization Failed: {e}")
            self.client = None
            self.collection = None

    def _seed_knowledge(self):
        if not self.collection: return
        
        try:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            json_path = os.path.join(base_dir, "../data/sample_processes.json")
            
            documents = []
            ids = []
            metadatas = []

            fallback_docs = [
                "In BPMN, a Start Event indicates where a particular process will begin.",
                "Gateways are used to control how the process flows. A Diamond shape represents a decision.",
                "Swimlanes (Pools) are used to organize activities into separate visual categories.",
                "An End Event indicates where a process finishes.",
                "User Tasks are tasks that need to be done by a human actor.",
                "Service Tasks are tasks that are done automatically by a system."
            ]

            if os.path.exists(json_path):
                with open(json_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for idx, item in enumerate(data):
                        text_content = f"Process Title: {item.get('title', '')}. Description: {item.get('description', '')}"
                        documents.append(text_content)
                        ids.append(f"sample_{idx}")
                        metadatas.append({"title": item.get('title', ''), "type": "sample_process"})
            else:
                documents = fallback_docs
                ids = [f"seed_{i}" for i in range(len(documents))]
                metadatas = [{"type": "definition"} for _ in range(len(documents))]

            if documents:
                self.collection.add(documents=documents, ids=ids, metadatas=metadatas)
                
        except Exception as e:
            print(f" RAG Seeding Failed: {e}")

    def add_documents(self, documents: list[str], source: str = "user_upload"):
        if not self.collection or not documents:
            return
        ids = [f"{source}_{os.urandom(4).hex()}_{i}" for i in range(len(documents))]
        self.collection.add(documents=documents, ids=ids)

    def query(self, text: str, n_results: int = 3) -> str:
        if not self.collection:
            return ""
            
        try:
            results = self.collection.query(query_texts=[text], n_results=n_results)
            if results['documents']:
                docs = [item for sublist in results['documents'] for item in sublist]
                return "\n".join(docs)
            return ""
        except Exception as e:
            print(f" RAG Search Error: {e}")
            return ""
