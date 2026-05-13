/**
 * aiService.ts
 *
 * Connects to the Vercel Serverless Architecture.
 * - Uses /api/chat for Lightning Fast Fuse.js RAG + Groq JSON
 * - Uses /api/news for Rate-Limitless RSS Legal News
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

// Types for the new structured JSON response
export interface StructuredAIResponse {
  topic?: string;
  risk_level?: string;
  summary?: string;
  actionable_steps?: string[];
  laws_cited?: Array<{ act: string; section: string; description: string }>;
  common_mistakes?: string[];
}

export const chatStream = async (
  messages: Message[],
  onUpdate: (content: string, citations?: Citation[]) => void,
  _sessionId?: string,
  language: string = "en",
  _argumentsMode: boolean = false,
  _analysisMode: boolean = false
): Promise<void> => {
  if (!messages.length) return;

  try {
    // Show a loading state to the user while Groq generates the JSON
    onUpdate("Analyzing legal context and generating actionable advice...");

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, language }),
    });

    if (!response.ok) throw new Error("API returned an error");

    const data: StructuredAIResponse = await response.json();

    // Format the JSON back into a beautiful Markdown string for the frontend UI
    let formattedResponse = `### ${data.topic || "Legal Analysis"}\n`;
    if (data.risk_level) {
      const riskColor = data.risk_level.toLowerCase() === "high" ? "🔴" : data.risk_level.toLowerCase() === "medium" ? "🟡" : "🟢";
      formattedResponse += `**Risk Level:** ${riskColor} ${data.risk_level}\n\n`;
    }
    
    formattedResponse += `**Summary:**\n${data.summary || "No summary provided."}\n\n`;

    if (data.actionable_steps && data.actionable_steps.length > 0) {
      formattedResponse += `**Actionable Steps:**\n`;
      data.actionable_steps.forEach((step, i) => {
        formattedResponse += `${i + 1}. ${step}\n`;
      });
      formattedResponse += "\n";
    }

    if (data.common_mistakes && data.common_mistakes.length > 0) {
      formattedResponse += `**Common Mistakes to Avoid:**\n`;
      data.common_mistakes.forEach(mistake => {
        formattedResponse += `- ${mistake}\n`;
      });
      formattedResponse += "\n";
    }

    // Map the JSON laws_cited back to the Citations array format the UI expects
    let citations: Citation[] = [];
    if (data.laws_cited && data.laws_cited.length > 0) {
      formattedResponse += `**Relevant Laws:**\n`;
      data.laws_cited.forEach(law => {
        formattedResponse += `- **${law.act} ${law.section}**: ${law.description}\n`;
        citations.push({
          source: law.act,
          section: law.section,
          text: law.description
        });
      });
    }

    // Call onUpdate with the final formatted string and citations
    onUpdate(formattedResponse, citations.length > 0 ? citations : undefined);

  } catch (error) {
    console.error("Chat Error:", error);
    onUpdate("Sorry, I encountered an error. Please try again.");
  }
};

export const getLegalNews = async () => {
  try {
    const response = await fetch("/api/news");
    if (!response.ok) throw new Error("News API failed");
    return await response.json();
  } catch (error) {
    console.error("News fetch error", error);
    return [];
  }
};

// Generic generation for templates/tools (Drafting etc)
export const generateLegalContent = async (
  prompt: string,
  _systemPrompt: string = ""
): Promise<string> => {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: prompt }], language: "en" }),
    });
    const data = await response.json();
    return data.summary || JSON.stringify(data);
  } catch (e) {
    return "Error generating content.";
  }
};

export const riskAnalyzer = async (_contractText: string) => {
  return { risks: [{ level: "Info", description: "Not fully implemented in this lightweight version yet.", remedy: "" }], overall_score: 50 };
};

export const compareLegalTexts = async (_text1: string, _text2: string) => {
  return { change_type: "Unknown", legal_impact: "Requires full document parse.", penalty_difference: "—", key_changes: [], verdict: "N/A" };
};
