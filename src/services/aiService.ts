import Groq from "groq-sdk";

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

// Use purely frontend browser-side Groq execution to completely bypass Vercel serverless crashes
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY || "dummy",
  dangerouslyAllowBrowser: true 
});

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
    if (!import.meta.env.VITE_GROQ_API_KEY) {
      onUpdate("VITE_GROQ_API_KEY is missing in Vercel. Please add it to your Environment Variables.");
      return;
    }

    onUpdate("Thinking...");

    const systemPrompt = `You are a professional Indian Legal AI Assistant. The user wants the response in ${language === "hi" ? "Hindi" : "English"}. You MUST structure your final response exactly using Markdown. Start with the direct answer, then list any 'Relevant Laws' (like BNS sections) at the bottom. Keep it professional.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      max_tokens: 1500,
    });

    const responseContent = chatCompletion.choices[0]?.message?.content || "No response generated.";
    onUpdate(responseContent);

  } catch (error: any) {
    console.error("Chat Error:", error);
    onUpdate(`Error: ${error.message}. Please check your VITE_GROQ_API_KEY.`);
  }
};

export const getLegalNews = async () => {
  try {
    // We use a free, CORS-friendly public proxy for RSS to bypass all backend server requirements
    const response = await fetch("https://api.rss2json.com/v1/api.json?rss_url=https://news.google.com/rss/search?q=Supreme+Court+India+OR+Indian+Law&hl=en-IN&gl=IN&ceid=IN:en");
    if (!response.ok) throw new Error("News fetch failed");
    
    const data = await response.json();
    return data.items.slice(0, 10).map((item: any) => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      source: "Google News",
    }));
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
    if (!import.meta.env.VITE_GROQ_API_KEY) return "VITE_GROQ_API_KEY missing.";
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
    });
    return chatCompletion.choices[0]?.message?.content || "No content generated.";
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

export const parseModelJson = <T = any>(jsonString: string, _arg2?: any, _arg3?: any): T => {
  try {
    return JSON.parse(jsonString) as T;
  } catch (e) {
    return {} as T;
  }
};
