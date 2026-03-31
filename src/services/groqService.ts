import { toast } from "sonner";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || "llama-3.3-70b-versatile";
const API_URL = "https://api.groq.com/openai/v1/chat/completions";
const RAG_API_BASE = (import.meta.env.VITE_RAG_API_BASE_URL || "/rag").replace(/\/$/, "");
const REQUEST_TIMEOUT_MS = 45000;
const MAX_RETRIES = 2;
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

type Citation = {
  source: string;
  section: string;
  text: string;
  [key: string]: unknown;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const parseErrorMessage = (errorBody: string) => {
  let message = "Failed to generate content";

  try {
    const errorData = JSON.parse(errorBody) as { error?: { message?: string } };
    message = errorData.error?.message || message;
  } catch {
    if (errorBody) {
      message = errorBody;
    }
  }

  return message;
};

const extractJsonCandidate = (content: string, kind: "object" | "array") => {
  const matcher = kind === "array" ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
  return content.match(matcher)?.[0] || content;
};

export const parseModelJson = <T>(content: string, context: string, kind: "object" | "array" = "object"): T => {
  try {
    const candidate = extractJsonCandidate(content, kind);
    return JSON.parse(candidate) as T;
  } catch (error) {
    console.error(`JSON Parse Error (${context}):`, error);
    throw new Error(`Failed to parse AI response format for ${context}.`);
  }
};

export const generateLegalContent = async (
  prompt: string,
  systemPrompt: string = "You are a Senior Advocate of the Supreme Court of India and a Constitutional Scholar. Your expertise covers the Constitution of India, Bharatiya Nyaya Sanhita (BNS), BNSS, BSA, and all major Central/State Acts. Always consider Fundamental Rights (Part III) and the Basic Structure Doctrine in your reasoning. Provide accurate, citation-backed information with a focus on Indian Jurisprudence."
): Promise<string> => {
  if (!GROQ_API_KEY) {
    toast.error("Groq API Key missing. Please check your .env file.");
    throw new Error("Missing API Key");
  }

  let lastError: unknown = null;

  try {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt },
            ],
            temperature: 0.2,
            max_tokens: 4096,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          const message = parseErrorMessage(errorBody);

          if (RETRYABLE_STATUS.has(response.status) && attempt < MAX_RETRIES) {
            await sleep(350 * (attempt + 1));
            continue;
          }

          throw new Error(message);
        }

        const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
          throw new Error("Received empty response content from Groq.");
        }

        return content;
      } catch (error) {
        lastError = error;

        if (error instanceof DOMException && error.name === "AbortError") {
          throw new Error("AI request timed out. Please try again.");
        }

        if (attempt < MAX_RETRIES) {
          await sleep(350 * (attempt + 1));
          continue;
        }

        throw error;
      } finally {
        window.clearTimeout(timeoutId);
      }
    }

    throw (lastError || new Error("Failed to generate content"));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Groq Generation Error:", error);
    toast.error(`AI Error: ${message}`);
    throw error;
  }
};

export const chatStream = async (
  messages: Message[],
  onUpdate: (content: string, citations?: Citation[]) => void,
  sessionId?: string,
  language: string = "en",
  argumentsMode: boolean = false,
  analysisMode: boolean = false
): Promise<void> => {
  if (!messages.length) {
    onUpdate("Please enter a legal query.");
    return;
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const lastUserMessage = messages[messages.length - 1].content;
    const response = await fetch(`${RAG_API_BASE}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        query: lastUserMessage,
        language: language,
        session_id: sessionId,
        arguments_mode: argumentsMode,
        analysis_mode: analysisMode
      })
    });

    if (!response.ok) {
      throw new Error("RAG API failed to respond");
    }

    const data = (await response.json()) as { answer?: string; citations?: Citation[] };
    const answer = data.answer || "No response generated.";
    const citations = Array.isArray(data.citations) ? data.citations : [];

    // Simulate Streaming for the UI
    const words = answer.split(" ");
    let currentText = "";
    for (let i = 0; i < words.length; i++) {
        currentText += words[i] + " ";
        onUpdate(currentText, i === words.length - 1 ? citations : undefined);
        await new Promise(r => setTimeout(r, 20)); // Slow down slightly to emulate streaming
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("RAG Chat Error:", error);
    toast.error(`Chat Error: ${message}`);
    // Fallback to error message
    onUpdate("Error connecting to the Legal RAG backend. Please verify the service is running and reachable.");
  } finally {
    window.clearTimeout(timeoutId);
  }
};

export const riskAnalyzer = async (contractText: string) => {
  const prompt = `Analyze the following legal contract for potential risks and liabilities under Indian Law (including Indian Contract Act 1872, CP Act 2019, and DPDP 2023). Identify specific clauses that are unfavorable and suggest remedies. Provide an overall risk score (0-100).\n\nCONTRACT TEXT:\n${contractText}`;
  const systemPrompt = `You are a high-level corporate legal auditor specializing in Indian Jurisprudence. Analyze documents for Section 10 validity (Contract Act), unfair trade practices, and constitutional safeguards. Return your analysis in valid JSON format ONLY with this structure: { "risks": [{"level": "High/Medium/Low", "description": "text", "remedy": "text"}], "overall_score": number }`;
  
  const content = await generateLegalContent(prompt, systemPrompt);
  return parseModelJson<{ risks: Array<{ level: string; description: string; remedy: string }>; overall_score: number }>(content, "risk analysis", "object");
};

export const compareLegalTexts = async (text1: string, text2: string) => {
  const prompt = `Deeply compare these two legal clauses/provisions:\n\nOLD LAW (IPC/CrPC):\n${text1}\n\nNEW LAW (BNS/BNSS/BSA):\n${text2}\n\nAnalyze technical shifts, penalty changes, and procedural modifications under the new criminal justice framework.`;
  const systemPrompt = `You are a Senior Legislative Analyst specialized in the transition from colonial-era laws to the Bharatiya Sanhitas. Return your analysis in valid JSON format ONLY with this structure: 
  { 
    "change_type": "Renumbered / Modified / Expanded / Restructured / Replaced / Omitted", 
    "legal_impact": "A concise summary of the legal impact...", 
    "penalty_difference": "Comparison of punishments (e.g. Increased, Decreased, Same)", 
    "key_changes": ["Point 1", "Point 2"], 
    "verdict": "Overall summary sentence" 
  }`;
  
  const content = await generateLegalContent(prompt, systemPrompt);
  return parseModelJson<{
    change_type: string;
    legal_impact: string;
    penalty_difference: string;
    key_changes: string[];
    verdict: string;
  }>(content, "legal comparison", "object");
};

export const getLegalNews = async () => {
  const currentYear = new Date().getFullYear();
  const prompt = `Generate 5 realistic, high-impact recent legal news items from India specifically from July 2024 to early ${currentYear}. 
  Focus ONLY on:
  1. The implementation and enforcement of the Bharatiya Nyaya Sanhita (BNS), BNSS, and BSA (active since July 1, 2024).
  2. Supreme Court judgments on Digital Privacy, Bail, and Civil Liberties.
  3. New Digital Personal Data Protection (DPDP) Act 2023 developments.
  Each item must be formatted as JSON with: title, summary, date (e.g. "Oct 2024"), category (e.g. "Criminal Law"). 
  Return ONLY a JSON array.`;
  const systemPrompt = `You are a high-level legal news curator. Only provide current, factually plausible updates for the Indian legal system for 2024-2025. Return valid JSON array ONLY.`;
  
  const content = await generateLegalContent(prompt, systemPrompt);
  try {
    return parseModelJson<Array<{ title: string; summary: string; date: string; category: string }>>(content, "legal news", "array");
  } catch (e) {
    // Fallback static data if AI fails
    return [
      {
        title: "BNS Implementation Milestone reached",
        summary: "Bharatiya Nyaya Sanhita (BNS) transition has successfully entered its next phase of digital integration.",
        date: "Latest",
        category: "Criminal Law"
      }
    ];
  }
};
