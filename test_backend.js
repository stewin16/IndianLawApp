import Parser from "rss-parser";
import Fuse from "fuse.js";
import fs from "fs";
import Groq from "groq-sdk";

const parser = new Parser({
  customFields: {
    item: ['description', 'pubDate', 'content:encoded', 'source']
  }
});

async function testNews() {
  console.log("=== TESTING NEWS RSS ===");
  const feed = await parser.parseURL("https://news.google.com/rss/search?q=Supreme+Court+India+OR+Indian+Law+OR+BNS+OR+High+Court+when:7d&hl=en-IN&gl=IN&ceid=IN:en");
  console.log(`Fetched ${feed.items.length} items. First item:`);
  console.log(feed.items[0].title);
}

async function testFuseAndGroq() {
  console.log("\n=== TESTING FUSE.JS RAG ===");
  const raw = fs.readFileSync("./api/data/bns_data.json", "utf-8");
  const legalDB = JSON.parse(raw);
  
  const fuseSearcher = new Fuse(legalDB, {
    keys: ["Chapter", "Section", "Section _name", "Description"],
    threshold: 0.3,
    ignoreLocation: true,
  });

  const query = "What is the punishment for murder under the BNS?";
  const searchResults = fuseSearcher.search(query, { limit: 2 });
  console.log(`Query: ${query}`);
  console.log(`Top match: BNS Section ${searchResults[0]?.item?.Section} - ${searchResults[0]?.item?.["Section _name"]}`);
}

async function main() {
  await testNews();
  await testFuseAndGroq();
  console.log("\nALL SYSTEMS GO!");
}

main();
