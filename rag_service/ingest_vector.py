import os
import json
import chromadb
from chromadb.utils import embedding_functions

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(base_dir, "data", "comprehensive_multi_domain.json")
    chroma_path = os.path.join(base_dir, "chroma_db")
    
    print(f"Loading data from {data_path}...")
    if not os.path.exists(data_path):
        print("Data file not found!")
        return

    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"Found {len(data)} legal provisions to ingest.")

    print(f"Initializing ChromaDB connection at {chroma_path}...")
    db_client = chromadb.PersistentClient(path=chroma_path)
    
    # Use the same model as RAGEngine
    ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    
    # Clear existing collection if it exists to ensure clean state
    try:
        db_client.delete_collection("legal_knowledge")
        print("Cleared existing 'legal_knowledge' collection.")
    except Exception:
        pass

    collection = db_client.get_or_create_collection(
        name="legal_knowledge", 
        embedding_function=ef,
        metadata={"description": "Core Indian Legal Database"}
    )

    documents = []
    metadatas = []
    ids = []

    print("Processing and chunking legal vectors...")
    for idx, item in enumerate(data):
        section = item.get("section", "N/A")
        title = item.get("title", "")
        description = item.get("description", "")
        act = item.get("act", "General Law")
        domain = item.get("domain", "")

        # Create a rich semantic text chunk
        content_block = f"{act} - Section {section}: {title}.\n{description}"
        
        documents.append(content_block)
        
        # Ensure 'source' is mapped for multi_model_orchestrator to read authority
        metadatas.append({
            "source": act,
            "section": section,
            "title": title,
            "domain": domain,
            "type": "statute"
        })
        
        # Unique ID combining act prefix and section
        act_prefix = "".join([word[0] for word in act.split() if word]).lower()
        ids.append(f"{act_prefix}_{section}_{idx}")

    print("Adding vectors to ChromaDB (this may download the embedding model if first run)...")
    collection.add(
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )

    print(f"Successfully ingested {collection.count()} vectors into the database!")

if __name__ == "__main__":
    main()
