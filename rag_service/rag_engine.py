
import os
import json
import re
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.utils import embedding_functions
import requests
import io
from text_processor import TextProcessor
from conversation_memory import ConversationMemory
from groq_client import GroqClient

class RAGEngine:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY") 
        self.model_name = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        self.model_legal = self.model_name
        self.model_simple = self.model_name
        
        if self.api_key:
            self.groq = GroqClient(self.api_key, self.model_name)
            print(f"[RAGEngine] Groq Key Found. Using Model: {self.model_name}")
        else:
            self.groq = None
            print("[RAGEngine] ⚠️ Warning: GROQ_API_KEY not found. LLM features disabled.")

        # Initialize Enhanced Text Processor
        self.text_processor = TextProcessor()
        
        # Initialize Conversation Memory
        self.conversation_memory = ConversationMemory()
        # Simple in-memory response cache
        self._cache: Dict[str, Dict[str, Any]] = {}

        # Initialize ChromaDB Client
        base_dir = os.path.dirname(os.path.abspath(__file__))
        chroma_path = os.path.join(base_dir, "chroma_db")
        
        try:
            self.db_client = chromadb.PersistentClient(path=chroma_path)
            self.ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
            self.collection = self.db_client.get_collection(name="legal_knowledge", embedding_function=self.ef)
            print(f"[RAGEngine] Connected to Vector DB at {chroma_path}. ({self.collection.count()} docs)")
        except Exception as e:
             print(f"[RAGEngine] ⚠️ Vector DB Connection Error: {e}. Ensure 'ingest_vector.py' has been run.")
             self.collection = None

    def _classify_query(self, query: str) -> str:
        """Classify query as 'simple' or 'legal' for optimization."""
        query_lower = query.lower()
        
        # Simple greetings/basic questions that don't need RAG
        simple_patterns = [
            'hello', 'hi', 'hey', 'thanks', 'thank you',
            'what is your name', 'who are you', 'what can you do',
            'help', 'how to use', 'what are you'
        ]
        
        if any(pattern in query_lower for pattern in simple_patterns):
            return 'simple'
        
        # Legal queries need full RAG pipeline
        legal_patterns = [
            'section', 'ipc', 'bns', 'law', 'legal', 'penalty', 'punishment',
            'act', 'case', 'judgment', 'court', 'crime', 'offence', 'right'
        ]
        
        if any(pattern in query_lower for pattern in legal_patterns):
            return 'legal'
        
        # Default to legal for safety
        return 'legal'
    
    def _call_llm(self, messages: List[Dict], max_tokens: int = 1500, timeout: int = 30, model_override: Optional[str] = None) -> str:
        """Helper to call Groq API with timeout."""
        if not self.groq:
            raise Exception("Groq Client not initialized (API Key missing)")

        try:
            return self.groq.chat_completion(
                messages,
                max_tokens=max_tokens,
                model=model_override,
                timeout=timeout,
            )
        except Exception as e:
            print(f"[RAGEngine] Groq request failed: {e}")
            raise e

    def _clean_text(self, text: str) -> str:
        """Cleans extracted text by normalizing whitespace."""
        return re.sub(r'\s+', ' ', text).strip()

    def _chunk_text(self, text: str, chunk_size: int = 4000) -> List[str]:
        """Splits text into chunks of approx chunk_size characters (roughly 1000 tokens)."""
        chunks = []
        for i in range(0, len(text), chunk_size):
            chunks.append(text[i:i + chunk_size])
        return chunks

    async def summarize(self, file_content: bytes, filename: str) -> str:
        """
        Advanced Summarization Pipeline: Extract -> Clean -> Chunk -> Summarize Parts -> Combine.
        Uses enhanced text processor with multi-modal extraction and 12-stage cleaning.
        """
        print(f"[RAGEngine] Processing file: {filename} ({len(file_content)} bytes)")
        
        full_text = ""
        extraction_method = "unknown"
        
        try:
            # 1. Extract Text (Enhanced with multi-modal support)
            if filename.lower().endswith(".pdf"):
                full_text, extraction_method = self.text_processor.extract_text_from_pdf(
                    file_content, filename, max_ocr_pages=100
                )
                
                if extraction_method == "failed":
                    return full_text  # Error message
            else:
                full_text = file_content.decode("utf-8", errors="ignore")
                extraction_method = "text"

            if not full_text.strip():
                return "Error: Could not extract text from document."

            # 2. Clean with 12-stage pipeline
            cleaned_text = self.text_processor.clean_text(full_text)
            print(f"[RAGEngine] Extracted {len(cleaned_text)} characters using {extraction_method}.")
            
            # 3. Detect language
            detected_lang = self.text_processor.detect_language(cleaned_text)
            print(f"[RAGEngine] Detected language: {detected_lang}")

            # 3. Chunk
            chunks = self._chunk_text(cleaned_text, chunk_size=8000) # ~ 2000 tokens
            print(f"[RAGEngine] Created {len(chunks)} chunks.")

            if not self.api_key:
                return f"LLM not configured. Extracted {len(cleaned_text)} chars. Start: {cleaned_text[:500]}..."

            # 4. Summarize Chunks
            chunk_summaries = []
            
            # Limit chunks to avoid timeouts (MVP limit: first 5 chunks)
            max_chunks = 5
            for i, chunk in enumerate(chunks[:max_chunks]):
                print(f"[RAGEngine] Summarizing chunk {i+1}/{min(len(chunks), max_chunks)}...")
                prompt = (
                    "You are a legal AI assistant. Summarize the following legal text clearly and accurately. "
                    "Preserve legal meaning, mention important sections/clauses, do NOT hallucinate. "
                    "Keep language formal.\n\n"
                    f"Text:\n{chunk}"
                )
                try:
                    summary = self._call_llm([{"role": "user", "content": prompt}], max_tokens=600)
                    chunk_summaries.append(summary)
                except Exception as e:
                    print(f"[RAGEngine] Chunk {i+1} failed: {e}")
            
            if not chunk_summaries:
                return "Error: Failed to generate any summaries."

            # 5. Combine -> Final Structured Summary
            print("[RAGEngine] Generating Final Structured Summary...")
            combined_text = "\n\n".join(chunk_summaries)
            
            final_system_prompt = (
                "You are an expert Legal Architect AI. "
                "Using the provided summaries of a legal document, create a single, Master Structured Summary. "
                "Format strictly in Markdown with the following sections:\n"
                "### 📌 Executive Summary\n(A concise overview)\n\n"
                "### 📑 Key Legal Sections Referenced\n(List specific Acts and Sections)\n\n"
                "### ⚖️ Critical Observations & Findings\n(Key points, obligations, facts)\n\n"
                "### 📚 Citations & Case Law\n(If any mentioned)\n\n"
                "### 🔮 Legal Implications\n(What this means for the parties)"
            )

            final_summary = self._call_llm([
                {"role": "system", "content": final_system_prompt},
                {"role": "user", "content": f"Summaries:\n{combined_text}"}
            ], max_tokens=1500)

            return final_summary

        except Exception as e:
            print(f"[RAGEngine] Summarization Pipeline Error: {e}")
            return f"Failed to summarize document: {str(e)}"

    async def compare_clauses(self, text1: str, text2: str) -> dict:
        """
        Compares two legal clauses and returns a structured JSON analysis.
        """
        if not self.api_key:
            return {"error": "API Key missing"}

        system_prompt = (
            "You are an expert Legal Analyst specializing in Indian Law (IPC vs BNS). "
            "Compare the two provided legal clauses deeply. "
            "You MUST return the result in valid JSON format with the following structure:\n"
            "{\n"
            '  "change_type": "Renumbered / Modified / New / Removed",\n'
            '  "legal_impact": "A concise summary of the legal impact...",\n'
            '  "penalty_difference": "No substantive change / Increased / Decreased",\n'
            '  "key_changes": ["Bullet point 1", "Bullet point 2"],\n'
            '  "verdict": "Minor procedural change" (or "Major substantive change")\n'
            "}\n"
            "Do not include any Markdown formatting (like ```json). Just the raw JSON string."
        )

        user_query = f"Clause A (Old/IPC): {text1}\n\nClause B (New/BNS): {text2}"

        try:
            response_text = self._call_llm([
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_query}
            ])
            
            # Clean up potential markdown code blocks if the LLM ignores instructions
            cleaned_text = response_text.replace("```json", "").replace("```", "").strip()
            
            import json
            try:
                # Attempt to parse JSON
                analysis_json = json.loads(cleaned_text)
                return analysis_json
            except json.JSONDecodeError:
                print(f"[RAGEngine] JSON Parse Error. Raw: {cleaned_text}")
                # Fallback to simple text if JSON fails
                return {
                    "change_type": "Analysis Generated",
                    "legal_impact": cleaned_text,
                    "penalty_difference": "See analysis",
                    "key_changes": ["Could not parse structured data"],
                    "verdict": "See details"
                }

        except Exception as e:
            print(f"[RAGEngine] Compare Error: {e}")
            return {"error": str(e)}

    async def query(self, query: str, language: str = "en", arguments_mode: bool = False, analysis_mode: bool = False, session_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Semantic Search + LLM Generation with Conversation Memory.
        
        Args:
            query: User's question
            language: 'en' or 'hi'
            arguments_mode: Generate balanced arguments
            analysis_mode: Generate neutral analysis
            session_id: Optional session ID for conversation memory
        """
        # Handle conversation memory and query reformulation
        original_query = query
        if session_id:
            self.conversation_memory.add_message(session_id, "user", original_query)

        if session_id:
            query = self.conversation_memory.reformulate_query(session_id, query)
            if query != original_query:
                print(f"[RAGEngine] Query reformulated: '{original_query}' -> '{query}'")
        
        # Safe print for Windows consoles (handles Hindi chars)
        safe_query = query.encode('ascii', 'replace').decode('ascii')
        print(f"[RAGEngine] Semantic Query: {safe_query} (Lang: {language})")

        LONG_TRIGGERS = ["explain", "detail", "elaborate", "analysis", "ingredients"]
        is_long = any(t in query.lower() for t in LONG_TRIGGERS)

        # 0. Smart Routing: rule-based first, LLM as optional fallback
        query_type = self._classify_query(query)
        if query_type == 'simple':
            # Use lightweight model for general chat
            try:
                greeting_prompt = (
                    "You are LegalAi. Answer the user's general question or greeting briefly and politely."
                )
                routing_response = self._call_llm([
                    {"role": "system", "content": greeting_prompt},
                    {"role": "user", "content": query}
                ], max_tokens=200, model_override=self.model_simple).strip()
                if routing_response:
                    print(f"[RAGEngine] Rule router DIRECT ANSWER: {routing_response[:50]}...")
                    return {
                        "answer": routing_response,
                        "citations": [],
                        "related_judgments": [],
                        "neutral_analysis": None,
                        "arguments": None
                    }
            except Exception as e:
                print(f"[RAGEngine] Simple route error: {e}. Proceeding with search.")
        else:
            # Optional LLM router as fallback when ambiguous
            try:
                router_prompt = (
                    "You are a Router. Classify the user input.\n"
                    "- If it is a greeting, general chat, or a question NOT about Indian Law, answer it directly and politely. DO NOT say 'I am a router'. Act as LegalAi.\n"
                    "- If it is a specific legal question, OR a request for 'details', 'explanation', 'elaboration', or a follow-up to a previous topic, reply ONLY with the word 'SEARCH'.\n"
                    "- If the input is ambiguous, reply 'SEARCH'.\n"
                    f"- User Language: {language}\n"
                    "User Input: " + query
                )
                routing_response = self._call_llm([{"role": "user", "content": router_prompt}], max_tokens=150, model_override=self.model_simple).strip()
                if "SEARCH" not in routing_response and len(routing_response) > 5:
                    print(f"[RAGEngine] LLM router DIRECT ANSWER: {routing_response[:50]}...")
                    return {
                        "answer": routing_response,
                        "citations": [],
                        "related_judgments": [],
                        "neutral_analysis": None,
                        "arguments": None
                    }
                print(f"[RAGEngine] Router chose SEARCH.")
            except Exception as e:
                print(f"[RAGEngine] Router Error: {e}. Falling back to Search.")

        
        context_text = ""
        citations = []
        related_judgments = []
        
        # 0.5 Cross-Lingual Search Optimization
        # If language is Hindi, translate query to English for better Vector Search recall
        search_query = query
        if language == 'hi':
            try:
                print(f"[RAGEngine] Translating query to English for Search...")
                translation_prompt = f"Translate the following Hindi legal query to precise English legal terms for a database search. Output ONLY the English translation.\nHindi: {query}"
                translated_query = self._call_llm([{"role": "user", "content": translation_prompt}], max_tokens=100).strip()
                safe_translated = translated_query.encode('ascii', 'replace').decode('ascii')
                safe_original = query.encode('ascii', 'replace').decode('ascii')
                print(f"[RAGEngine] Translated: '{safe_original}' -> '{safe_translated}'")
                search_query = translated_query
            except Exception as e:
                print(f"[RAGEngine] Translation failed: {e}. Using original query.")

        # 1. Retrieve from Vector DB
        try:
            print(f"[RAGEngine] Starting Vector Search for '{search_query}'...", flush=True)
            if self.collection:
                results = self.collection.query(
                    query_texts=[search_query], # Use the (potentially) translated query
                    n_results=5,
                    include=["documents", "metadatas", "distances"]
                )
                docs = (results.get('documents') or [[]])[0] if results else []
                metas = (results.get('metadatas') or [[]])[0] if results else []
                dists = (results.get('distances') or [[]])[0] if results else []

                print(f"[RAGEngine] Vector Search Complete. Found: {len(docs)} docs", flush=True)
                
                min_dist = min(dists) if dists else 1.0
                
                # Group results and sort to prioritize new Sanhitas
                retrieved_items = list(zip(docs, metas, dists))
                
                def sort_key(item):
                    doc, meta, dist = item
                    law = (meta.get('law') or '').upper()
                    # Priority 0 for new Sanhitas, Priority 1 for others
                    if 'BNS' in law or 'BNSS' in law or 'BSA' in law:
                        return (0, dist)
                    return (1, dist)
                
                retrieved_items.sort(key=sort_key)
                
                for doc, meta, dist in retrieved_items:
                    
                    # Relevance Cutoff tightened: dynamic + absolute guard
                    if dist > (min_dist + 0.15) or dist > 0.4:
                        continue
                    # Limit context size: max 4 docs, ~2000 chars per doc
                    if len(context_text.split('---\n')) > 4:
                        break
                    snippet = doc[:2000]
                    src = meta.get('source', 'Unknown')
                    law = meta.get('law')
                    section = meta.get('section') or meta.get('bns_section') or meta.get('ipc_section')
                    context_text += f"---\nSource: {src}\nContent: {snippet}\n"
                    
                    if meta.get("type") == "statute":
                         citations.append({
                             "source": (law or "Statute"),
                             "section": f"Section {section}" if section else None,
                             "url": meta.get("url"),
                             "text": snippet[:200] + "..."
                         })
                    elif meta.get("type") == "judgment":
                         title = meta.get("title", "Unknown Case")
                         if title and title != "Unknown Case":
                             citations.append({
                                 "source": "Supreme Court Judgment", 
                                 "section": title, 
                                 "text": snippet[:200] + "..."
                             })
                             related_judgments.append({
                                 "title": title,
                                 "summary": snippet[:200] + "...",
                                 "case_id": meta.get("case_id", "")
                             })
            else:
                context_text = "Database not available. Answer generically."
        except Exception as e:
             print(f"[RAGEngine] ⚠️ Vector Search Error: {e}")
             context_text = "Search unavailable."

        # 2. Generate Answer with LLM
        answer = "I apologize, but I cannot generate an answer at this moment."
        neutral_analysis = None
        arguments = None
        
        print(f"[RAGEngine] Preparing LLM request...", flush=True)
        if self.api_key:
            system_prompt = (
                "You are LegalAi, a Senior Advocate of the Supreme Court of India and a Constitutional Scholar.\n\n"
                "Your expertise covers the Constitution of India, Bharatiya Nyaya Sanhita (BNS), BNSS, BSA, and all major Central/State Acts.\n\n"
                "CRITICAL KNOWLEDGE (MUST FOLLOW):\n"
                "1. The Bharatiya Nyaya Sanhita (BNS), Bharatiya Nagarik Suraksha Sanhita (BNSS), and Bharatiya Sakshya Adhiniyam (BSA) ARE THE CURRENT LAWS OF INDIA. They came into effect on July 1, 2024, replacing the IPC, CrPC, and IEA respectively.\n"
                "2. DO NOT refer to them as 'proposed', 'upcoming', or 'bills'. They are the ACTIVE STATUTES.\n"
                "3. Use BNS-first logic. For every criminal query, identify the relevant BNS section immediately. Mention IPC ONLY as a secondary historical reference if necessary.\n"
                "4. Answer REAL-LIFE SCENARIOS by applying the current law to the facts provided. Maintain a objective, analytical tone.\n"
                "5. CITE YOUR SOURCES. Always include inline citations to the Acts and Sections you reference (e.g., [Section 303(2), BNS]).\n"
                "6. Always check if the Constitutional Fundamental Rights (Part III) apply to the scenario.\n"
                "7. If sufficient legal context is not available, say: \"Insufficient verified legal context available.\"\n"
                "8. Do NOT invent section numbers, punishments, or provisions. Always ensure section references are legally accurate for Indian jurisdiction.\n\n"
                "STRUCTURE YOUR ANSWER:\n"
                "1. Direct Answer (1–2 sentences)\n"
                "2. Constitutional Perspective (if applicable)\n"
                "3. Relevant Provisions (BNS/BNSS/BSA with citations)\n"
                "4. Real-life Application/Scenario Analysis\n"
                "5. Punishment & Consequences\n"
                "6. Verifiable Source & Citations\n\n"
                "FORMATTING:\n- Use Markdown with clear headings & bullets.\n- Bold section numbers and Act names.\n"
                "DISCLAIMER: For informational purposes only. Not legal advice."
            )
            if language == "hi":
                system_prompt += (
                    "\n\nLANGUAGE RULE:\n- Respond fully in Hindi (Devanagari).\n- Section numbers and Act names may remain in English characters.\n"
                    "- Translate legal terms to Hindi where appropriate. Do NOT reply in English."
                )

            if is_long:
                system_prompt += (
                    "\n\nLONG-FORM REQUEST:\n"
                    "- Provide a detailed explanation with additional context when possible."
                )

            if analysis_mode:
                system_prompt += (
                    "\n[NEUTRAL ANALYSIS REQUESTED]\n"
                    "You must also provide a Neutral Analysis section at the end.\n"
                    "Strictly use this format:\n"
                    "[FACTORS]\n- Factor 1\n- Factor 2\n[/FACTORS]\n"
                    "[INTERPRETATIONS]\n- Interpretation 1\n- Interpretation 2\n[/INTERPRETATIONS]"
                )
            
            if arguments_mode:
                system_prompt += (
                    "\n[ARGUMENTS REQUESTED]\n"
                    "You must also provide Balanced Arguments at the end.\n"
                    "Strictly use this format:\n"
                    "[FOR]\n- Argument For 1\n- Argument For 2\n[/FOR]\n"
                    "[AGAINST]\n- Argument Against 1\n- Argument Against 2\n[/AGAINST]"
                )

            user_query = f"Context:\n{context_text}\n\nQuery: {query}\n"
            
            # Append instructions to User Prompt for Recency Bias
            if analysis_mode:
                user_query += (
                    "\n\nIMPORTANT: You MUST also provide a Neutral Analysis at the very end.\n"
                    "Use this EXACT format:\n"
                    "[FACTORS]\n- Factor 1\n- Factor 2\n[/FACTORS]\n"
                    "[INTERPRETATIONS]\n- Interpretation 1\n- Interpretation 2\n[/INTERPRETATIONS]"
                )

            if arguments_mode:
                 user_query += (
                    "\n\nIMPORTANT: You MUST also provide Balanced Arguments at the very end.\n"
                    "Use this EXACT format:\n"
                    "[FOR]\n- Argument For 1\n[/FOR]\n"
                    "[AGAINST]\n- Argument Against 1\n[/AGAINST]"
                )

            try:
                print(f"[RAGEngine] Calling LLM now...", flush=True)
                # Check cache (keyed by query + language + modes + top sources)
                cache_key = f"{language}|{analysis_mode}|{arguments_mode}|{query.strip()}|{','.join([c.get('source','') for c in citations[:2]])}"
                if cache_key in self._cache:
                    cached = self._cache[cache_key]
                    response = {
                        "answer": cached.get("answer", ""),
                        "citations": citations[:3],
                        "related_judgments": related_judgments[:3],
                        "neutral_analysis": cached.get("neutral_analysis"),
                        "arguments": cached.get("arguments")
                    }
                    if session_id:
                        self.conversation_memory.add_message(session_id, "assistant", response.get("answer", ""))
                    return response

                max_tokens = 2000 if is_long else 1500
                raw_answer = self._call_llm([
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_query}
                ], max_tokens=max_tokens, model_override=self.model_legal)
                print(f"[RAGEngine] LLM returned response.", flush=True)
                try:
                    print(f"\n[DEBUG] Raw LLM Answer:\n{raw_answer.encode('utf-8', 'replace').decode('utf-8')}\n[DEBUG] End Raw Answer\n", flush=True)
                except Exception:
                     print(f"\n[DEBUG] Raw LLM Answer: (encoding error)\n[DEBUG] End Raw Answer\n", flush=True)
                
                def extract_tag(text, start_tag, end_tag):
                    # Try exact tag first
                    pattern = f"{re.escape(start_tag)}\\s*(.*?)\\s*{re.escape(end_tag)}"
                    match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
                    
                    if not match and "ARGUMENTS" in start_tag:
                         # Fallback for "ARGUMENTS FOR" variations
                         alt_start = start_tag.replace("FOR", "ARGUMENTS FOR").replace("AGAINST", "ARGUMENTS AGAINST")
                         pattern = f"{re.escape(alt_start)}\\s*(.*?)\\s*{re.escape(end_tag)}"
                         match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)

                    if match:
                        content = match.group(1).strip()
                        return [item.strip("- *").strip() for item in content.split("\n") if item.strip()]
                    return []

                if analysis_mode:
                    factors = extract_tag(raw_answer, "[FACTORS]", "[/FACTORS]")
                    interpretations = extract_tag(raw_answer, "[INTERPRETATIONS]", "[/INTERPRETATIONS]")
                    if factors or interpretations:
                        neutral_analysis = {"factors": factors or ["Analysis pending"], "interpretations": interpretations or ["Further research required"]}
                
                if arguments_mode:
                    for_args = extract_tag(raw_answer, "[FOR]", "[/FOR]")
                    against_args = extract_tag(raw_answer, "[AGAINST]", "[/AGAINST]")
                    if for_args or against_args:
                        arguments = {"for": for_args or ["N/A"], "against": against_args or ["N/A"]}

                # Remove the special sections from the main answer to avoid duplication
                # Expanded regex to catch variations like [ARGUMENTS FOR]
                answer = re.sub(r'\[/?(FACTORS|INTERPRETATIONS|FOR|AGAINST|ARGUMENTS FOR|ARGUMENTS AGAINST)\]', '', raw_answer, flags=re.IGNORECASE).strip()
                
                # Robust approach: Split by the first occurrence of any special tag
                # Added NEUTRAL ANALYSIS and BALANCED ARGUMENTS which the LLM was using
                split_patterns = ["[FACTORS]", "[INTERPRETATIONS]", "[FOR]", "[AGAINST]", "[ARGUMENTS FOR]", "[ARGUMENTS AGAINST]", "[NEUTRAL ANALYSIS]", "[BALANCED ARGUMENTS]"]
                for p in split_patterns:
                    # Case insensitive check for splitting
                    idx = answer.upper().find(p)
                    if idx != -1:
                        answer = answer[:idx].strip()

                # Cleanup
                answer = re.sub(r'\n{3,}', '\n\n', answer).strip()
                # Cache the structured result
                self._cache[cache_key] = {
                    "answer": answer,
                    "arguments": arguments,
                    "neutral_analysis": neutral_analysis
                }
                
            except Exception as e:
                print(f"[RAGEngine] LLM Error: {e}")
                answer = f"Error: {str(e)}"

        response = {
            "answer": answer,
            "citations": citations[:3],
            "related_judgments": related_judgments[:3], 
            "arguments": arguments,
            "neutral_analysis": neutral_analysis,
            "disclaimer": "AI-generated response. For informational purposes only. Consult a qualified lawyer."
        }

        if session_id:
            self.conversation_memory.add_message(session_id, "assistant", response.get("answer", ""))

        return response

    def generate_draft(self, draft_type: str, details: str, language: str = 'en') -> str:
        """
        Generates a formal legal draft based on the user's details.
        """
        print(f"[RAGEngine] Generating draft: {draft_type}", flush=True)
        
        templates = {
            "legal_notice": "## LEGAL NOTICE\nThrough Registered Post / Speed Post / Email\nDate: [Date]\n\nTo,\n[Recipient Name]\n[Recipient Address]\n\n### Subject:\n**Legal Notice under [Applicable Law] regarding [Issue Brief]**\n\nSir/Madam,\n\nUnder instructions and on behalf of my client **[Sender Name]**, residing at [Sender Address], I hereby serve upon you the present legal notice as follows:\n\n### 1. Facts of the Case\nThat my client [Brief Background].\nThat despite requests, you have [Breach Description].\n\n### 2. Legal Provisions\nYour actions amount to violation of:\n- **[Section Name] of [Act Name]**\n- Other applicable provisions of law\n\n### 3. Cause of Action\nThat the cause of action arose on [Date] and continues to subsist.\n\n### 4. Demand\nYou are hereby called upon to:\n- [Specific Demand]\nwithin **[Time Limit] days** from receipt of this notice.\n\n### 5. Consequences\nFailing compliance, my client shall initiate legal proceedings at your risk.\n\nYours faithfully,\n**[Advocate Name]**\nAdvocate for [Sender Name]",
            
            "nda": "## NON-DISCLOSURE AGREEMENT (NDA)\n\nThis Agreement is entered into on [Date] between:\n\n**Party A:** [Party A Name], at [Address A]\n**Party B:** [Party B Name], at [Address B]\n\n### 1. Purpose\nThe parties wish to exchange confidential information for [Purpose].\n\n### 2. Definition of Confidential Information\n'Confidential Information' includes all written, oral, electronic information disclosed.\n\n### 3. Obligations\nThe Receiving Party shall:\n- Not disclose confidential information to third parties\n- Use the information solely for the stated purpose\n\n### 4. Exclusions\nInformation publicly available or required by law is excluded.\n\n### 5. Term\nValid for [Duration] years.\n\n### 6. Governing Law\nGoverned by laws of **India**.\n\n### 7. Jurisdiction\nCourts at [City] shall have exclusive jurisdiction.\n\nIN WITNESS WHEREOF, the parties have signed.\n\n**Party A Signature:** __________\n**Party B Signature:** __________",
            
            "rent_agreement": "## RENT AGREEMENT\n\nThis Agreement is made on [Date] between:\n\n**Landlord:** [Landlord Name]\n**Tenant:** [Tenant Name]\n\n### 1. Property\nThe Landlord lets out the premises located at [Property Address].\n\n### 2. Rent\nMonthly rent shall be ₹[Rent Amount], payable on or before [Due Date].\n\n### 3. Security Deposit\nTenant shall pay ₹[Security Deposit] as refundable security deposit.\n\n### 4. Term\nValid for [Duration] months.\n\n### 5. Maintenance\nTenant shall maintain the premises and not sublet without permission.\n\n### 6. Termination\nEither party may terminate with [Notice Period] days’ notice.\n\nSigned on [Date].\n\n**Landlord Signature:** _______\n**Tenant Signature:** _______",
            
            "affidavit": "## AFFIDAVIT\n\nI, [Deponent Name], aged [Age], residing at [Address], do hereby solemnly affirm:\n\n1. That I am the deponent herein and competent to swear this affidavit.\n2. That [Statement of Facts].\n3. That the statements made herein are true to my knowledge.\n\nVerified at [Place] on [Date].\n\n**DEPONENT SIGNATURE**\n\nSolemnly affirmed before me on [Date].\n\n**Notary / Oath Commissioner**",
            
            "employment_contract": "## EMPLOYMENT AGREEMENT\n\nThis Agreement is entered on [Date] between:\n\n**Employer:** [Company Name]\n**Employee:** [Employee Name]\n\n### 1. Designation\nEmployee shall serve as [Designation].\n\n### 2. Duties\nEmployee shall perform duties assigned from time to time.\n\n### 3. Salary\nMonthly remuneration shall be ₹[Salary].\n\n### 4. Confidentiality\nEmployee shall maintain confidentiality during and after employment.\n\n### 5. Termination\nEither party may terminate with [Notice Period] days’ notice.\n\nSigned:\n\nEmployer: _______\nEmployee: _______",
            
            "posh_complaint": "## COMPLAINT UNDER POSH ACT, 2013\n\nTo,\nThe Internal Complaints Committee\n[Organization Name]\n\n### Subject:\nComplaint under **Sexual Harassment of Women at Workplace Act, 2013**\n\nI, [Complainant Name], employed as [Designation], submit the following:\n\n### 1. Incident Details\nOn [Date], at [Place], the respondent [Respondent Name] [Description of Harassment].\n\n### 2. Evidence\n[List of Evidence]\n\n### 3. Relief Sought\nI request appropriate inquiry and action under POSH Act.\n\nI affirm the above facts are true.\n\nSignature: ______\nDate: ______",
            
            "rti_application": "## APPLICATION UNDER RTI ACT, 2005\n\nTo,\nThe Public Information Officer\n[Department Name]\n\nSubject: Information under RTI Act, 2005\n\nSir/Madam,\n\nKindly provide the following information:\n\n1. [Question 1]\n2. [Question 2]\n\nI have enclosed the application fee of ₹10.\n\nAddress for correspondence: [Address]\n\nDate: [Date]\nApplicant Signature: _______"
        }

        template = templates.get(draft_type, "Generate a formal legal document for the user.")

        system_prompt = (
            "You are an Indian Legal Drafting Assistant.\n\n"
            "TASK:\n"
            f"Fill in the following template based on the user's details. Do not change the legal structure unless necessary.\n\n"
            f"TEMPLATE:\n{template}\n\n"
            "RULES:\n"
            "- Replace placeholders like [Name], [Date] with actual info from user input.\n"
            "- If info is missing, keep the placeholder or make a reasonable inference (e.g., 'Date: Today').\n"
            "- OUTPUT ONLY THE DOCUMENT CONTENT.\n"
            "- Add a disclaimer at the very bottom.\n\n"
        )

        if language == 'hi':
            system_prompt += (
                "CRITICAL LANGUAGE RULE: Respond FULLY in Hindi (Devanagari script).\n"
                "Use formal legal Hindi (Vidhi Hindi).\n"
            )
        else:
            system_prompt += "Respond in English."

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Details for draft:\n{details}"}
        ]

        try:
            # Using model_simple for lightweight draft generation.
            return self._call_llm(messages, max_tokens=2000, model_override=self.model_simple)
        except Exception as e:
            print(f"[RAGEngine] Drafting failed: {e}")
            return f"Error: Could not generate draft. Reason: {str(e)}"
