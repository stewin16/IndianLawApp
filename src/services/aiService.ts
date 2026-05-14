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
  maxTokens = 2000
): Promise<string> {
  if (!import.meta.env.VITE_GROQ_API_KEY) {
    return "⚠️ **VITE_GROQ_API_KEY is not set.** Please add it to your Vercel Environment Variables and redeploy.";
  }
  const res = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
  });
  return res.choices[0]?.message?.content?.trim() || "No response generated.";
}

// ─── Tool route map — used by AI to suggest tools ─────────────────────────────
export const TOOL_ROUTES: Record<string, { label: string; path: string; emoji: string; description: string }> = {
  drafter: { label: "Document Drafter", path: "/draft", emoji: "📄", description: "Draft rental agreements, legal notices, NDAs, affidavits, court memorials & more" },
  fir: { label: "FIR Generator", path: "/tools/fir-generator", emoji: "🚨", description: "Generate a properly formatted FIR complaint draft" },
  bail: { label: "Bail Checker", path: "/tools/bail-checker", emoji: "🔓", description: "Check bail eligibility under BNS 2023 & BNSS 2023" },
  consumer: { label: "Consumer Complaint", path: "/tools/consumer-complaint", emoji: "🛒", description: "Draft a consumer grievance under Consumer Protection Act 2019" },
  risk: { label: "Risk Analyzer", path: "/tools/risk-analyzer", emoji: "🛡️", description: "Analyze contracts and agreements for legal risks" },
  section: { label: "Section Finder", path: "/tools/section-finder", emoji: "🔍", description: "Find applicable IPC/BNS sections for any offense" },
  rti: { label: "RTI Application", path: "/tools/rti-generator", emoji: "📋", description: "Generate an RTI application to any government department" },
  case: { label: "Case Predictor", path: "/tools/case-predictor", emoji: "⚖️", description: "Predict likely case outcome based on facts" },
  property: { label: "Property Verifier", path: "/tools/property-verifier", emoji: "🏠", description: "Verify property documents and check legal status" },
  lawyer: { label: "Find a Lawyer", path: "/tools/lawyer-finder", emoji: "👨‍⚖️", description: "Find lawyers near you on a live map" },
  labor: { label: "Labour Advisor", path: "/tools/labor-advisor", emoji: "👷", description: "Know your rights under Indian labour laws" },
  divorce: { label: "Divorce Guide", path: "/tools/divorce-guide", emoji: "💔", description: "Navigate divorce proceedings under Indian family law" },
  cyber: { label: "Cyber Crime Reporter", path: "/tools/cyber-crime-reporter", emoji: "💻", description: "Report cyber crimes and know your digital rights" },
  cost: { label: "Legal Cost Estimator", path: "/tools/legal-cost-estimator", emoji: "💰", description: "Estimate legal fees and court costs for your case" },
};

// ─── Detect if the user's message needs a tool ────────────────────────────────
export const detectToolIntent = (userMessage: string): string | null => {
  const m = userMessage.toLowerCase();
  if (/(draft|write|create|prepare|make|generate).*(document|agreement|contract|notice|affidavit|memorial|nda|rent|lease|will|deed|letter)/i.test(m)) return "drafter";
  if (/(fir|first information report|police complaint|file.*(police|complaint))/i.test(m)) return "fir";
  if (/(bail|bailable|non.?bailable|get bail|apply for bail)/i.test(m)) return "bail";
  if (/(consumer|refund|defective product|amazon|flipkart|complaint.*(seller|shop|company))/i.test(m)) return "consumer";
  if (/(analyze|analyse|check|review).*(contract|agreement|clause)/i.test(m)) return "risk";
  if (/(which section|what section|find section|applicable section|ipc|bns section for)/i.test(m)) return "section";
  if (/\brti\b|right to information|government information/i.test(m)) return "rti";
  if (/(predict|outcome|chance|win|lose|success).*(case|court|suit)/i.test(m)) return "case";
  if (/(property|land|flat|house).*(verify|check|legal|title|encumbrance)/i.test(m)) return "property";
  if (/(find|need|want|looking for|hire|consult).*(lawyer|advocate|attorney|legal help)/i.test(m)) return "lawyer";
  if (/(labour|labor|employee|employer|salary|pf|esic|termination|wrongful dismissal)/i.test(m)) return "labor";
  if (/(divorce|separation|alimony|maintenance|matrimonial)/i.test(m)) return "divorce";
  if (/(cyber|hacking|online fraud|data breach|social media|digital)/i.test(m)) return "cyber";
  if (/(cost|fee|charge|how much|legal.*(expense|cost))/i.test(m)) return "cost";
  return null;
};

// ─── MASTER SYSTEM PROMPT ─────────────────────────────────────────────────────
const buildChatSystemPrompt = (language: string, domain: string = "all") => {
  const lang = language === "hi" ? "Hindi (Shuddh, formal)" : "English";
  const domainContext = domain !== "all"
    ? `Focus primarily on ${domain} law aspects in your response.`
    : "Cover all relevant areas of Indian law including criminal, civil, constitutional, consumer, property, family, and corporate law.";

  return `You are a Senior Indian Legal AI Advisor with deep expertise in:
- Bharatiya Nyaya Sanhita (BNS) 2023
- Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023
- Bharatiya Sakshya Adhiniyam (BSA) 2023
- Indian Penal Code (IPC) 1860
- Code of Criminal Procedure (CrPC) 1973
- Consumer Protection Act 2019
- Constitution of India
- Indian Contract Act 1872
- Transfer of Property Act 1882
- Hindu Marriage Act, Muslim Personal Law, Special Marriage Act
- Income Tax Act, GST law
- Labour laws (Industrial Disputes Act, POSH Act)
- RTI Act 2005

${domainContext}

RESPONSE LANGUAGE: Reply ONLY in ${lang}.

MANDATORY RESPONSE FORMAT — YOU MUST ALWAYS FOLLOW THIS EXACT STRUCTURE:

## [Topic/Legal Issue Title]

### 📋 Direct Answer
[2-3 sentences directly answering the question]

### ⚖️ Applicable Law & Sections
[List every relevant law section with the act name, section number, and a clear explanation. Format:
- **[Act Name], Section [Number]**: [What this section says and how it applies]]

### 🔍 Detailed Legal Analysis
[3-5 paragraphs of detailed explanation — cover:
1. What the law says
2. How courts have interpreted it (mention landmark judgments if relevant)
3. What the user's rights/liabilities are
4. What the burden of proof is, if applicable]

### ✅ Practical Next Steps
[Numbered list of concrete, actionable steps the user can take immediately]

### 💡 Important Considerations
[2-3 key caveats, exceptions, or things to watch out for]

RULES:
- Be comprehensive and detailed — short answers are not acceptable
- Always cite specific BNS/IPC/Act section numbers
- Mention landmark Supreme Court judgments when relevant (e.g., Maneka Gandhi v Union of India, K.S. Puttaswamy v Union of India)
- Use bold formatting for section numbers and key legal terms
- Write in a professional but accessible tone
- If a question involves both old law (IPC) and new law (BNS), mention BOTH and explain the difference`;
};

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

  const systemPrompt = buildChatSystemPrompt(language);

  try {
    const chatCompletion = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.3,
      max_tokens: 2500,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    });

    const text =
      chatCompletion.choices[0]?.message?.content || "No response generated.";

    // Parse inline citations [BNS 103], [IPC 420], [BNSS 41], etc.
    const citationRegex = /\*\*([A-Z][A-Za-z\s]+(?:Act|Code|Sanhita|Adhiniyam)?),?\s+(?:Section|s\.|Sec\.?)\s*([\d\w,\s]+?)\*\*/gi;
    const citations: Citation[] = [];
    let match: RegExpExecArray | null;
    while ((match = citationRegex.exec(text)) !== null) {
      citations.push({
        source: match[1].trim(),
        section: match[2].trim(),
        text: match[0],
      });
    }

    onUpdate(text, citations.length > 0 ? citations : undefined);
  } catch (err: any) {
    console.error("chatStream error:", err);
    onUpdate(`❌ **Error:** ${err.message}. Please try again.`);
  }
};

// ─── Generic content generator used by ALL tool pages ─────────────────────────
export const generateLegalContent = async (
  prompt: string,
  systemPrompt: string = `You are a Senior Indian Legal Expert. Provide detailed, accurate, and professionally structured legal guidance based on Indian law including BNS 2023, BNSS 2023, and all relevant Indian statutes. Always cite specific section numbers. Be comprehensive and thorough.`
): Promise<string> => {
  try {
    return await callGroq(systemPrompt, prompt, 2000);
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
  const systemPrompt = `You are an expert Indian contract law analyst with deep knowledge of Indian Contract Act 1872, Specific Relief Act 1963, and commercial law.
Analyse the provided contract text and identify ALL legal risks comprehensively.
Return a valid JSON object in this exact format — nothing else, no markdown wrapper:
{
  "overall_score": <number 0-100, where 100 = maximum risk>,
  "risks": [
    { "level": "High|Medium|Low", "description": "<specific clause or risk description>", "remedy": "<concrete recommended action or clause amendment>" }
  ]
}
Identify at least 4-6 distinct risks. Be specific about which clause creates the risk.`;
  const raw = await callGroq(systemPrompt, contractText, 2000);
  return parseModelJson<{ overall_score: number; risks: any[] }>(raw);
};

// ─── Compare Legal Texts (used by ComparisonPage) ─────────────────────────────
export const compareLegalTexts = async (text1: string, text2: string) => {
  const systemPrompt = `You are an expert in Indian criminal law, specifically in comparing IPC and BNS sections.
Return a valid JSON object in this exact format — nothing else:
{
  "change_type": "<Added|Removed|Modified|Unchanged>",
  "legal_impact": "<detailed explanation of the legal impact>",
  "penalty_difference": "<specific how punishment changed, with numbers>",
  "key_changes": ["<specific change 1>", "<specific change 2>", "<specific change 3>"],
  "verdict": "<brief authoritative summary verdict>"
}`;
  const raw = await callGroq(
    systemPrompt,
    `Compare these two legal texts:\n\nText 1 (e.g., IPC section):\n${text1}\n\nText 2 (e.g., BNS section):\n${text2}`,
    1500
  );
  return parseModelJson(raw);
};
