import type { VercelRequest, VercelResponse } from "@vercel/node";
import Groq from "groq-sdk";
import Fuse from "fuse.js";
import fs from "fs";
import path from "path";

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Cache the database and search engine so warm starts are instant
let legalDB: any[] = [];
let fuseSearcher: Fuse<any> | null = null;

const loadData = () => {
  if (legalDB.length > 0) return;
  try {
    const dataPath = path.join(process.cwd(), "api", "data", "bns_data.json");
    const raw = fs.readFileSync(dataPath, "utf-8");
    legalDB = JSON.parse(raw);
    
    // Initialize Fuzzy Search Engine
    fuseSearcher = new Fuse(legalDB, {
      keys: ["Chapter", "Section", "Section _name", "Description"],
      threshold: 0.3, // 0.0 is perfect match, 1.0 is match anything
      ignoreLocation: true,
      includeScore: true,
    });
    console.log(`Loaded ${legalDB.length} BNS laws into memory.`);
  } catch (err) {
    console.error("Failed to load legal data:", err);
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { messages, language = "en" } = req.body;
  if (!messages?.length) return res.status(400).json({ error: "Messages required" });

  // Get the last user message
  const userMessage = messages[messages.length - 1].content;

  // 1. Search the local BNS Database
  loadData();
  let contextStr = "No specific laws found in DB.";
  if (fuseSearcher) {
    const searchResults = fuseSearcher.search(userMessage, { limit: 4 });
    if (searchResults.length > 0) {
      contextStr = searchResults.map(r => {
        const law = r.item;
        return `Law: BNS Section ${law.Section} (${law.Chapter})\nTitle: ${law["Section _name"]}\nDescription: ${law.Description}`;
      }).join("\n\n");
    }
  }

  // 2. Build the strict JSON prompt
  const systemPrompt = `
You are LegalAI, an expert Indian Law Assistant. Your primary focus is on the Bharatiya Nyaya Sanhita (BNS).
The user asked a legal question. 

Use the following legal laws (retrieved from our database) to answer accurately:
${contextStr}

CRITICAL RULES:
1. You MUST output ONLY valid JSON. No markdown fences around the JSON. Just the raw JSON object.
2. If the user asks something non-legal, refuse politely but still in JSON format.
3. ${language === "hi" ? "Respond entirely in Hindi." : "Respond in English."}

JSON SCHEMA FORMAT REQUIRED:
{
  "topic": "Detected Legal Topic (e.g., Cybercrime, Property Dispute)",
  "risk_level": "High/Medium/Low",
  "summary": "A 2-sentence summary of their situation and rights.",
  "actionable_steps": [
    "Step 1...",
    "Step 2..."
  ],
  "laws_cited": [
    {
      "act": "BNS / IPC / Specific Act",
      "section": "Section Number",
      "description": "Brief explanation of this law"
    }
  ],
  "common_mistakes": [
    "Mistake to avoid 1",
    "Mistake to avoid 2"
  ]
}
`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const answer = completion.choices[0]?.message?.content || "{}";
    
    // Parse it just to ensure it's valid before sending to client
    const jsonAnswer = JSON.parse(answer);
    
    return res.status(200).json(jsonAnswer);

  } catch (error) {
    console.error("Groq API Error:", error);
    return res.status(500).json({ error: "Failed to generate AI response." });
  }
}
