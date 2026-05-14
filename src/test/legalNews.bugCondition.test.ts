import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getLegalNews } from "@/services/groqService";

/**
 * Legal News - RSS Feed Integration Tests
 *
 * Validates that getLegalNews() returns properly shaped objects from the
 * RSS2JSON proxy. Each item must have: title, link, pubDate, source.
 */

describe("Legal News RSS Feed", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("should return an array of news items", async () => {
    // Mock the RSS2JSON proxy response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "ok",
          items: [
            {
              title: "Supreme Court delivers landmark privacy ruling",
              link: "https://indiankanoon.org/test",
              pubDate: "2025-05-14 10:00:00",
              author: "Indian Kanoon",
            },
            {
              title: "BNS 2023 replaces IPC — key changes explained",
              link: "https://www.indiacode.nic.in/test",
              pubDate: "2025-05-13 08:30:00",
              author: "India Code",
            },
          ],
        }),
    } as any);

    const news = await getLegalNews();

    expect(Array.isArray(news)).toBe(true);
    expect(news.length).toBeGreaterThan(0);
  });

  it("should return items with the correct shape", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "ok",
          items: [
            {
              title: "High Court upholds tenant rights",
              link: "https://ecourts.gov.in/test",
              pubDate: "2025-05-10 12:00:00",
              author: "eCourts India",
            },
          ],
        }),
    } as any);

    const news = await getLegalNews();

    expect(news[0]).toHaveProperty("title");
    expect(news[0]).toHaveProperty("link");
    expect(news[0]).toHaveProperty("pubDate");
    expect(news[0]).toHaveProperty("source");
  });

  it("should return fallback news items when the fetch fails", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const news = await getLegalNews();

    expect(Array.isArray(news)).toBe(true);
    expect(news.length).toBeGreaterThan(0);
    // Fallback items still have required fields
    expect(news[0]).toHaveProperty("title");
    expect(news[0]).toHaveProperty("link");
    expect(news[0]).toHaveProperty("pubDate");
    expect(news[0]).toHaveProperty("source");
  });

  it("should return fallback news items when the RSS proxy returns an error status", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "error",
          message: "Invalid RSS feed",
        }),
    } as any);

    const news = await getLegalNews();

    expect(Array.isArray(news)).toBe(true);
    expect(news.length).toBeGreaterThan(0);
  });

  it("should not return more than 10 news items", async () => {
    const manyItems = Array.from({ length: 20 }, (_, i) => ({
      title: `Legal News Item ${i + 1}`,
      link: `https://indiankanoon.org/item${i + 1}`,
      pubDate: "2025-05-14 10:00:00",
      author: "Google News",
    }));

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "ok",
          items: manyItems,
        }),
    } as any);

    const news = await getLegalNews();

    expect(news.length).toBeLessThanOrEqual(10);
  });
});