import os
import sys
import time
from typing import List

# Ensure Wikipedia package is installed
try:
    import wikipedia
except ImportError:
    import subprocess
    print("Installing wikipedia package...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "wikipedia"])

import chromadb
from chromadb.utils import embedding_functions
from langchain_community.document_loaders import WikipediaLoader

def chunk_text(text: str, chunk_size=1000, overlap=250):
    chunks = []
    i = 0
    while i < len(text):
        chunks.append(text[i:i+chunk_size])
        i += (chunk_size - overlap)
    return chunks

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    chroma_path = os.path.join(base_dir, "chroma_db")
    
    print("=" * 60)
    print("STARTING ENTERPRISE LEGAL DATA INGESTION (BATCH MODE)")
    print("=" * 60)

    print(f"Connecting to Local Vector Database at {chroma_path}...")
    db_client = chromadb.PersistentClient(path=chroma_path)
    ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    
    # We GET the existing collection (so we don't wipe out the existing 60 BNS sections!)
    collection = db_client.get_or_create_collection(
        name="legal_knowledge", 
        embedding_function=ef
    )

    # List of massive foundational Indian law topics to scrape full contextual text for
    law_topics = [
        "Constitution of India",
        "Bharatiya Nyaya Sanhita",
        "Indian Penal Code",
        "Bharatiya Nagarik Suraksha Sanhita",
        "Code of Criminal Procedure (India)",
        "Bharatiya Sakshya Act, 2023",
        "Indian Evidence Act, 1872",
        "Information Technology Act, 2000",
        "Protection of Children from Sexual Offences Act",
        "Consumer Protection Act, 2019"
    ]

    all_raw_documents = []

    print("\n[Phase 1] Harvesting massive legal texts...")
    for topic in law_topics:
        try:
            print(f" -> Fetching full text for: '{topic}'...")
            # We fetch the exact page and up to 3 highly related sub-pages
            docs = WikipediaLoader(query=topic, load_max_docs=4).load()
            all_raw_documents.extend(docs)
            print(f"    ✓ Retrieved {len(docs)} documents.")
        except Exception as e:
             print(f"    ⚠️ Failed to fetch {topic}: {e}")
    
    print(f"\n[Phase 2] Chunking {len(all_raw_documents)} massive document objects...")
    
    split_chunks = []
    for doc in all_raw_documents:
        text_content = doc.page_content
        metadict = doc.metadata
        
        # Native chunking
        raw_chunks = chunk_text(text_content, 1000, 250)
        for c in raw_chunks:
            split_chunks.append({
                "page_content": c,
                "metadata": metadict
            })
            
    print(f"✓ Split into {len(split_chunks)} distinct semantic chunks.")

    print("\n[Phase 3] Generating Embeddings & Persisting to Vectors...")
    
    batch_size = 250
    total_chunks = len(split_chunks)
    
    for i in range(0, total_chunks, batch_size):
        batch = split_chunks[i:i + batch_size]
        
        documents = []
        metadatas = []
        ids = []
        
        for j, chunk in enumerate(batch):
            documents.append(chunk["page_content"])
            
            src = chunk["metadata"].get("source", "Unknown Wikipedia Law")
            title = chunk["metadata"].get("title", "Law Subject")
            
            metadatas.append({
                "source": title,
                "url": src,
                "type": "massive_import"
            })
            
            # Unique ID
            global_idx = i + j
            ids.append(f"wiq_law_{global_idx}_{int(time.time())}")
            
        print(f" -> Embedding & Inserting Batch {i//batch_size + 1}/{total_chunks//batch_size + 1} (Chunks {i} to {min(i+batch_size, total_chunks)})...")
        collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
        
    print("\n" + "=" * 60)
    print(f"SUCCESS! The Vector Database has scaled up to {collection.count()} total legal dimensions.")
    print("Legal AI is now enormously intelligent and fully aware of deep statutory contexts.")
    print("=" * 60)

if __name__ == "__main__":
    main()
