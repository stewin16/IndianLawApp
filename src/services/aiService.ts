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

// ─── Groq client (browser-safe) ───────────────────────────────────────────────
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY || "",
  dangerouslyAllowBrowser: true,
});

const MODEL = "llama-3.3-70b-versatile";

// ─── Helper: call Groq and get text back ──────────────────────────────────────
async function callGroq(
  systemPrompt: string,
  userContent: string,
  maxTokens = 1500
): Promise<string> {
  if (!import.meta.env.VITE_GROQ_API_KEY) {
    return "⚠️ VITE_GROQ_API_KEY is not set. Please add it to your Vercel Environment Variables and redeploy.";
  }
  const res = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
  });
  return res.choices[0]?.message?.content?.trim() || "No response generated.";
}

// ─── Chat stream (used by ChatPage) ───────────────────────────────────────────
export const chatStream = async (
  messages: Message[],
  onUpdate: (content: string, citations?: Citation[]) => void,
  _sessionId?: string,
  language: string = "en",
  _argumentsMode: boolean = false,
  _analysisMode: boolean = false
): Promise<void> => {
  if (!messages.length) return;

  if (!import.meta.env.VITE_GROQ_API_KEY) {
    onUpdate(
      "⚠️ **VITE_GROQ_API_KEY is missing.** Please add it to your Vercel Environment Variables and redeploy."
    );
    return;
  }

  onUpdate("Thinking...");

  const lang = language === "hi" ? "Hindi" : "English";
  const systemPrompt = `You are a highly knowledgeable Indian Legal AI Assistant specialising in Indian law — IPC, BNS, BNSS, CrPC, consumer law, family law, property law, and constitutional law.

Reply ONLY in ${lang}.

Structure every response with proper Markdown:
- Begin with a clear **direct answer** to the user's question.
- Add **relevant laws / sections** (BNS/IPC/other Acts) in a bullet list.
- End with 2-3 concise **practical next steps** the user can take.
- Always add a one-line disclaimer at the bottom.

Keep your tone professional but accessible. Never refuse a legal question — if uncertain, provide your best guidance with a caveat.`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      max_tokens: 1800,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    });

    const text =
      chatCompletion.choices[0]?.message?.content || "No response generated.";

    // Parse inline citations [BNS 103], [IPC 420], etc.
    const citationRegex = /\[(BNS|IPC|BNSS|CrPC|BSA)\s*([\w\s,]+?)\]/gi;
    const citations: Citation[] = [];
    let match: RegExpExecArray | null;
    while ((match = citationRegex.exec(text)) !== null) {
      citations.push({
        source: match[1].toUpperCase(),
        section: match[2].trim(),
        text: match[0],
      });
    }

    onUpdate(text, citations.length > 0 ? citations : undefined);
  } catch (err: any) {
    console.error("chatStream error:", err);
    onUpdate(`❌ Error: ${err.message}`);
  }
};

// ─── Generic content generator used by ALL tool pages ─────────────────────────
export const generateLegalContent = async (
  prompt: string,
  systemPrompt: string = "You are an expert Indian Legal Assistant. Provide clear, accurate legal guidance based on Indian law."
): Promise<string> => {
  try {
    return await callGroq(systemPrompt, prompt, 1500);
  } catch (err: any) {
    console.error("generateLegalContent error:", err);
    return `Error generating content: ${err.message}`;
  }
};

// ─── JSON helper used by tool pages that need structured output ───────────────
export const parseModelJson = <T = any>(raw: string, ..._extra: any[]): T => {
  try {
    // Strip markdown code fences if present
    const cleaned = raw
      .replace(/```json\n?/gi, "")
      .replace(/```\n?/gi, "")
      .trim();
    return JSON.parse(cleaned) as T;
  } catch {
    // Try to extract the first JSON object/array from the response
    const objMatch = raw.match(/\{[\s\S]*\}/);
    const arrMatch = raw.match(/\[[\s\S]*\]/);
    const candidate = objMatch?.[0] || arrMatch?.[0] || "{}";
    try {
      return JSON.parse(candidate) as T;
    } catch {
      return {} as T;
    }
  }
};

// ─── Legal News — fetches from Google News via RSS2JSON proxy ────────────────
export const getLegalNews = async () => {
  const RSS_URL = encodeURIComponent(
    "https://news.google.com/rss/search?q=Supreme+Court+India+OR+High+Court+India+OR+BNS+2023+OR+Indian+law&hl=en-IN&gl=IN&ceid=IN:en"
  );
  const PROXY = `https://api.rss2json.com/v1/api.json?rss_url=${RSS_URL}&count=12`;

  try {
    const res = await fetch(PROXY);
    if (!res.ok) throw new Error(`RSS proxy responded ${res.status}`);
    const data = await res.json();

    if (data.status !== "ok") throw new Error("RSS proxy returned error");

    return (data.items as any[]).slice(0, 10).map((item) => ({
      title: item.title?.replace(/\s*-\s*[^-]+$/, "").trim() || "Legal Update",
      link: item.link || "#",
      pubDate: item.pubDate || new Date().toISOString(),
      source: item.author || "Google News",
    }));
  } catch (err) {
    console.error("getLegalNews error:", err);
    // Return fallback static news so the landing page isn't blank
    return [
      {
        title: "Supreme Court issues key ruling on constitutional rights",
        link: "https://indiankanoon.org",
        pubDate: new Date().toISOString(),
        source: "Indian Kanoon",
      },
      {
        title: "BNS 2023 replaces IPC: Key changes every citizen must know",
        link: "https://www.indiacode.nic.in",
        pubDate: new Date().toISOString(),
        source: "India Code",
      },
      {
        title: "High Court upholds tenant rights in landmark property case",
        link: "https://ecourts.gov.in",
        pubDate: new Date().toISOString(),
        source: "eCourts India",
      },
    ];
  }
};

// ─── Risk Analyzer (used by RiskAnalyzerPage) ────────────────────────────────
export const riskAnalyzer = async (contractText: string) => {
  const systemPrompt = `You are an expert Indian contract law analyst. Analyse the provided contract text and identify legal risks.
Return a valid JSON object in this exact format — nothing else:
{
  "overall_score": <number 0-100, where 100 = maximum risk>,
  "risks": [
    { "level": "High|Medium|Low", "description": "<risk description>", "remedy": "<recommended action>" }
  ]
}`;
  const raw = await callGroq(systemPrompt, contractText, 2000);
  return parseModelJson<{ overall_score: number; risks: any[] }>(raw);
};

// ─── Compare Legal Texts (used by ComparisonPage) ─────────────────────────────
export const compareLegalTexts = async (text1: string, text2: string) => {
  const systemPrompt = `You are an expert in Indian criminal law, specifically in comparing IPC and BNS sections.
Return a valid JSON object in this exact format — nothing else:
{
  "change_type": "<Added|Removed|Modified|Unchanged>",
  "legal_impact": "<explanation of impact>",
  "penalty_difference": "<how punishment changed>",
  "key_changes": ["<change 1>", "<change 2>"],
  "verdict": "<brief summary verdict>"
}`;
  const raw = await callGroq(
    systemPrompt,
    `Compare these two legal texts:\n\nText 1:\n${text1}\n\nText 2:\n${text2}`,
    1200
  );
  return parseModelJson(raw);
};
