import type { VercelRequest, VercelResponse } from "@vercel/node";

const PINECONE_API_KEY  = process.env.PINECONE_API_KEY!;
const ASSISTANT_NAME    = process.env.PINECONE_ASSISTANT_NAME || "indian-law-assistant";
const PINECONE_HOST     = process.env.PINECONE_HOST || "https://prod-1-data.ke.pinecone.io";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages, language = "en", argumentsMode = false, analysisMode = false } = req.body as {
    messages: Array<{ role: string; content: string }>;
    language?: string;
    argumentsMode?: boolean;
    analysisMode?: boolean;
  };

  if (!messages?.length) {
    return res.status(400).json({ error: "messages array is required" });
  }

  if (!PINECONE_API_KEY) {
    return res.status(500).json({ error: "PINECONE_API_KEY not configured on server." });
  }

  // Build the system message injected at the start
  let systemContent = 
    "You are LegalAI, a strict Senior Advocate of the Supreme Court of India. " +
    "YOUR ONLY PURPOSE IS TO ANSWER QUESTIONS ABOUT INDIAN LAW including the Constitution, BNS, BNSS, BSA, IPC, CrPC, and all major Indian Acts. " +
    "If any question is NOT related to Indian law, refuse with: 'I am a specialized Indian Law Assistant. I can only assist with matters related to Indian Jurisprudence.' " +
    "Always cite specific sections and Acts. Use Markdown formatting with bolded section names.";

  if (language === "hi") {
    systemContent += " CRITICAL: Respond fully in Hindi (Devanagari script). Section names may remain in English.";
  }
  if (argumentsMode) {
    systemContent += " The user has requested balanced arguments. Include a section analyzing both sides of the legal issue.";
  }
  if (analysisMode) {
    systemContent += " The user has requested neutral analysis. Provide an objective breakdown of all legal factors at play.";
  }

  // Pinecone Assistant chat/completions format
  const payload = {
    messages: [
      { role: "system", content: systemContent },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    stream: false,
  };

  try {
    const response = await fetch(
      `${PINECONE_HOST}/assistant/chat/${ASSISTANT_NAME}`,
      {
        method: "POST",
        headers: {
          "Api-Key": PINECONE_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Pinecone API error:", response.status, errText);
      return res.status(response.status).json({ error: `Pinecone error: ${errText}` });
    }

    const data = await response.json() as {
      message?: { content?: string };
      choices?: Array<{ message?: { content?: string } }>;
      citations?: Array<{ position?: number; references?: Array<{ file?: { name?: string }; pages?: number[] }> }>;
    };

    // Handle both Pinecone Assistant format and OpenAI-compatible format
    const answer =
      data?.message?.content ||
      data?.choices?.[0]?.message?.content ||
      "No response generated.";

    // Extract citations if Pinecone returned them
    const citations = (data?.citations || []).flatMap((c) =>
      (c.references || []).map((ref) => ({
        source: ref?.file?.name || "Legal Document",
        section: ref?.pages ? `Page ${ref.pages.join(", ")}` : "",
        text: "",
      }))
    );

    return res.status(200).json({ answer, citations });
  } catch (err) {
    console.error("Chat API error:", err);
    return res.status(500).json({ error: "Internal server error calling Pinecone." });
  }
}
