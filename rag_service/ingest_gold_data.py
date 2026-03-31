import os
import json
import chromadb
from chromadb.utils import embedding_functions

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "data")
    chroma_path = os.path.join(base_dir, "chroma_db")

    # Authoritative JSON sources
    sources = [
        {"file": "ipc_bns_mapping.json", "type": "statute"},
        {"file": "golden_dataset.json", "type": "case_law"}
    ]

    print("============================================================")
    print("GOLD DATA INGESTION: BUILDING LEGAL LAKE (SCALE PHASE)")
    print("============================================================")

    # Initialize ChromaDB
    db_client = chromadb.PersistentClient(path=chroma_path)
    collection = db_client.get_or_create_collection(
        name="legal_knowledge",
        metadata={"hnsw:space": "cosine"}
    )

    # Consistent embedding engine
    sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )

    all_docs = []
    all_metas = []
    all_ids = []

    for src in sources:
        file_path = os.path.join(data_dir, src["file"])
        if not os.path.exists(file_path):
            print(f"Skipping {src['file']} (Not found)")
            continue

        print(f"-> Processing {src['file']}...")
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
            for index, item in enumerate(data):
                content = ""
                meta = {"source": src["file"], "type": src["type"]}
                
                # Case Law Processing
                if src["type"] == "case_law":
                    title = item.get("case_laws", [{}])[0].get("title", "Case Law")
                    summary = item.get("case_laws", [{}])[0].get("summary", "")
                    content = f"Case: {title}\nSummary: {summary}\nAnalysis: {item.get('neutral_analysis', {}).get('factors', [])}"
                    meta["title"] = title
                
                # Statute Mapping Processing
                elif src["type"] == "statute":
                    bns_sec = item.get("bns", "N/A")
                    ipc_sec = item.get("ipc", "N/A")
                    text = item.get("text_bns", "")
                    topic = item.get("topic", "")
                    content = f"Statute: {topic}\nBNS Section: {bns_sec}\nIPC Equivalent: {ipc_sec}\nDetails: {text}"
                    meta["section"] = bns_sec
                    meta["title"] = topic

                if content.strip():
                    all_docs.append(content)
                    all_metas.append(meta)
                    all_ids.append(f"gold_{src['file']}_{index}")

    # Batch Upsert (Scale Handling)
    batch_size = 200
    print(f"\n[Ready] Preparing to insert {len(all_docs)} high-quality legal vectors.")
    
    for i in range(0, len(all_docs), batch_size):
        end = min(i + batch_size, len(all_docs))
        collection.add(
            ids=all_ids[i:end],
            documents=all_docs[i:end],
            metadatas=all_metas[i:end]
        )
        print(f"✓ Injected batch {i//batch_size + 1}: Chunks {i} to {end}")

    print("============================================================")
    print("SUCCESS: High-Scale Gold Data Ingestion Complete.")
    print(f"Vector Database Scale: {collection.count()} total nodes.")
    print("============================================================")

if __name__ == "__main__":
    main()
