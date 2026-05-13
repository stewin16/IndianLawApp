/**
 * aiService.ts
 *
 * All AI integrations (Groq, Pinecone, Local Models) have been completely removed.
 * This file remains as a disconnected stub so the React frontend does not crash
 * due to missing imports.
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

const DISCONNECTED_MSG = "⚙️ The AI backend has been completely removed. No AI models are connected.";

// Helper to keep typescript happy if tool pages use it
export const parseModelJson = <T>(
  _content: string,
  _context: string,
  _kind: "object" | "array" = "object"
): T => {
  throw new Error("AI disconnected.");
};

export const generateLegalContent = async (
  _prompt: string,
  _systemPrompt: string = ""
): Promise<string> => {
  return DISCONNECTED_MSG;
};

export const chatStream = async (
  messages: Message[],
  onUpdate: (content: string, citations?: Citation[]) => void,
  _sessionId?: string,
  _language: string = "en",
  _argumentsMode: boolean = false,
  _analysisMode: boolean = false
): Promise<void> => {
  if (!messages.length) return;
  onUpdate(DISCONNECTED_MSG);
};

export const riskAnalyzer = async (_contractText: string) => {
  return { risks: [{ level: "Info", description: DISCONNECTED_MSG, remedy: "" }], overall_score: 0 };
};

export const compareLegalTexts = async (_text1: string, _text2: string) => {
  return {
    change_type: "Disconnected",
    legal_impact: DISCONNECTED_MSG,
    penalty_difference: "—",
    key_changes: [],
    verdict: DISCONNECTED_MSG,
  };
};

export const getLegalNews = async () => {
  return [
    {
      title: "AI Backend Disconnected",
      summary: "All AI functionality has been removed from this application.",
      date: "—",
      category: "System",
    },
  ];
};
