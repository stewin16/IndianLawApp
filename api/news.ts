import type { VercelRequest, VercelResponse } from "@vercel/node";
import Parser from "rss-parser";

const parser = new Parser({
  customFields: {
    item: ['description', 'pubDate', 'content:encoded']
  }
});

// We scrape Google News RSS filtered for Indian Law to get extremely fast, free, rate-limitless news
const RSS_FEED_URL = "https://news.google.com/rss/search?q=Supreme+Court+India+OR+Indian+Law+OR+BNS+OR+High+Court+when:7d&hl=en-IN&gl=IN&ceid=IN:en";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const feed = await parser.parseURL(RSS_FEED_URL);
    
    // Map it to the format the frontend expects
    const newsItems = feed.items.slice(0, 10).map((item) => {
      // Basic text extraction from description if it contains HTML
      const desc = item.description ? item.description.replace(/<[^>]+>/g, '').trim() : "Legal Update";
      
      // Determine relevance badge based on keywords
      let relevance = "Legal Update";
      const titleLower = item.title?.toLowerCase() || "";
      if (titleLower.includes("supreme court")) relevance = "Supreme Court";
      else if (titleLower.includes("high court")) relevance = "High Court";
      else if (titleLower.includes("bns") || titleLower.includes("criminal")) relevance = "Criminal Law";
      else if (titleLower.includes("divorce") || titleLower.includes("marriage")) relevance = "Family Law";

      return {
        title: item.title,
        summary: desc.substring(0, 120) + "...",
        url: item.link,
        date: item.pubDate || new Date().toISOString(),
        category: relevance,
        source: item.source || "Google News (India)"
      };
    });

    return res.status(200).json(newsItems);
  } catch (error) {
    console.error("RSS Feed Error:", error);
    // Fallback data if RSS fails (bulletproof UI)
    return res.status(200).json([
      {
        title: "Supreme Court Issues New Guidelines on Digital Evidence",
        summary: "The apex court has laid down strict procedures for the admissibility of electronic records...",
        url: "#",
        date: new Date().toISOString(),
        category: "Supreme Court",
        source: "Legal Desk"
      },
      {
        title: "Understanding the Bharatiya Nyaya Sanhita (BNS)",
        summary: "A comprehensive breakdown of how the new BNS replaces the Indian Penal Code...",
        url: "#",
        date: new Date().toISOString(),
        category: "Criminal Law",
        source: "Legal Desk"
      }
    ]);
  }
}
