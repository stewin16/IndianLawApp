/**
 * aiService.ts
 * 
 * Calls the Vercel serverless /api/chat endpoint which securely
 * proxies requests to the Pinecone Assistant RAG backend.
 * 
 * The Pinecone Assistant has been loaded with Indian law datasets:
 * - BNS (Bharatiya Nyaya Sanhita) sections
 * - IPC sections & full text
 * - IPC→BNS mapping
 * - IT Act
 * - Curated Indian Law Q&A golden dataset
 */

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export type Citation = {
  source: string;
  section: string;
  text: string;
  [key: string]: unknown;
};

// Helper: parse JSON out of model response text
const extractJsonCandidate = (content: string, kind: "object" | "array") => {
  const matcher = kind === "array" ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
  return content.match(matcher)?.[0] || content;
};

export const parseModelJson = <T>(
  content: string,
  context: string,
  kind: "object" | "array" = "object"
): T => {
  try {
    const candidate = extractJsonCandidate(content, kind);
    return JSON.parse(candidate) as T;
  } catch (error) {
    console.error(`JSON Parse Error (${context}):`, error);
    throw new Error(`Failed to parse AI response for ${context}.`);
  }
};

/**
 * Core RAG chat — calls the secure /api/chat Vercel serverless function
 * which in turn calls the Pinecone Indian Law Assistant.
 */
export const chatStream = async (
  messages: Message[],
  onUpdate: (content: string, citations?: Citation[]) => void,
  _sessionId?: string,
  language: string = "en",
  argumentsMode: boolean = false,
  analysisMode: boolean = false
): Promise<void> => {
  if (!messages.length) {
    onUpdate("Please enter a legal query.");
    return;
  }

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        language,
        argumentsMode,
        analysisMode,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err);
    }

    const data = await response.json() as { answer: string; citations: Citation[] };
    const answer = data.answer || "No response generated.";
    const citations = data.citations || [];

    // Simulate streaming effect for the UI
    const words = answer.split(" ");
    let currentText = "";
    for (let i = 0; i < words.length; i++) {
      currentText += words[i] + (i < words.length - 1 ? " " : "");
      onUpdate(currentText, i === words.length - 1 ? citations : undefined);
      await new Promise((r) => setTimeout(r, 15));
    }
  } catch (error) {
    console.error("Chat error:", error);
    onUpdate(
      "I encountered an error connecting to the Legal AI backend. Please try again."
    );
  }
};

/**
 * generateLegalContent — used by tool pages (Drafting, Summarize, etc.)
 * Also routes through the secure /api/chat endpoint.
 */
export const generateLegalContent = async (
  prompt: string,
  _systemPrompt: string = ""
): Promise<string> => {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }],
      language: "en",
    }),
  });

  if (!response.ok) throw new Error("Failed to generate legal content.");
  const data = await response.json() as { answer: string };
  return data.answer || "No response generated.";
};

// ---------------------------------------------------------------------------
// Tool-specific helpers
// ---------------------------------------------------------------------------

export const riskAnalyzer = async (contractText: string) => {
  const content = await generateLegalContent(
    `Analyze this contract for risks under Indian Law:\n${contractText}\n\nReturn ONLY valid JSON: { "risks": [{"level": "High/Medium/Low", "description": "text", "remedy": "text"}], "overall_score": number }`
  );
  return parseModelJson<{ risks: any[]; overall_score: number }>(content, "risk analysis", "object");
};

export const compareLegalTexts = async (text1: string, text2: string) => {
  const content = await generateLegalContent(
    `Compare these legal clauses under Indian Law:\nOld (IPC):\n${text1}\nNew (BNS):\n${text2}\n\nReturn ONLY valid JSON: { "change_type": "Modified", "legal_impact": "text", "penalty_difference": "text", "key_changes": ["point"], "verdict": "text" }`
  );
  return parseModelJson<any>(content, "legal comparison", "object");
};

export const getLegalNews = async () => {
  const content = await generateLegalContent(
    "Generate 5 realistic recent legal news items from India (2024-2025). Focus on BNS, BNSS, and Supreme Court judgments. Return ONLY a valid JSON array: [{\"title\": \"\", \"summary\": \"\", \"date\": \"\", \"category\": \"\"}]"
  );
  try {
    return parseModelJson<any[]>(content, "legal news", "array");
  } catch {
    return [
      {
        title: "LegalAI Active",
        summary: "The Indian Law RAG assistant is online.",
        date: "Today",
        category: "System",
      },
    ];
  }
};
