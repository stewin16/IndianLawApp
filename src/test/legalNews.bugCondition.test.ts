import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getLegalNews } from "@/services/groqService";

/**
 * Bug Condition Exploration Test for Stale Legal News
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * **DO NOT attempt to fix the test or the code when it fails**
 * **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
 * **GOAL**: Surface counterexamples that demonstrate 2022 dates are being returned instead of 2024-2025
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
 */

describe("Legal News Bug Condition Exploration", () => {
  let originalFetch: any;
  let mockApiCalls: any[] = [];

  beforeEach(() => {
    mockApiCalls = [];
    
    // Store original fetch
    originalFetch = global.fetch;
    
    // Mock fetch to simulate Groq API responses that return 2022 dates
    global.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      const requestBody = JSON.parse(options.body);
      mockApiCalls.push({ url, body: requestBody });
      
      // Simulate Groq API returning content with 2022 dates (the bug)
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify([
              {
                title: "Supreme Court ruling on digital privacy rights",
                summary: "The Supreme Court delivered a landmark judgment on digital privacy, establishing new precedents for data protection in India.",
                date: "Jan 2022", // BUG: This should be 2024-2025 but returns 2022
                category: "Digital Privacy"
              },
              {
                title: "New amendments to criminal procedure code",
                summary: "Significant changes to the criminal procedure code have been announced, affecting court proceedings nationwide.",
                date: "March 2022", // BUG: This should be 2024-2025 but returns 2022
                category: "Criminal Law"
              },
              {
                title: "Corporate law reforms introduced",
                summary: "The government has introduced comprehensive reforms to corporate governance and compliance requirements.",
                date: "Feb 2022", // BUG: This should be 2024-2025 but returns 2022
                category: "Corporate Law"
              },
              {
                title: "Environmental law updates for industries",
                summary: "New environmental regulations have been implemented to strengthen pollution control measures.",
                date: "April 2022", // BUG: This should be 2024-2025 but returns 2022
                category: "Environmental Law"
              },
              {
                title: "Tax law changes affecting businesses",
                summary: "Recent modifications to tax laws will impact business operations and compliance requirements.",
                date: "May 2022", // BUG: This should be 2024-2025 but returns 2022
                category: "Tax Law"
              }
            ])
          }
        }]
      };

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });
    });

    // Mock environment variables
    vi.stubEnv('VITE_GROQ_API_KEY', 'mock-api-key');
    vi.stubEnv('VITE_GROQ_MODEL', 'llama-3.3-70b-versatile');
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("should return current 2024-2025 legal news dates", async () => {
    // This test expects current dates (2024-2025) but will get 2022 dates on unfixed code
    const newsItems = await getLegalNews();
    
    // Verify we got news items
    expect(newsItems).toBeDefined();
    expect(Array.isArray(newsItems)).toBe(true);
    expect(newsItems.length).toBeGreaterThan(0);
    
    // CRITICAL: Check that all dates are from 2024-2025, not 2022
    // On UNFIXED code, this will FAIL because the API returns 2022 dates
    newsItems.forEach((item, index) => {
      expect(item.date, `News item ${index + 1} should have current date`).toMatch(/2024|2025/);
      expect(item.date, `News item ${index + 1} should not have 2022 date`).not.toMatch(/2022/);
    });
  });

  it("should generate news about current legal developments (BNS, BNSS, BSA)", async () => {
    const newsItems = await getLegalNews();
    
    // Check that news items reference current legal developments
    const newsContent = newsItems.map(item => `${item.title} ${item.summary}`).join(' ').toLowerCase();
    
    // On UNFIXED code, this might fail because AI generates generic content
    // instead of current BNS/BNSS/BSA related news
    const hasCurrentLegalTerms = 
      newsContent.includes('bns') || 
      newsContent.includes('bharatiya nyaya sanhita') ||
      newsContent.includes('bnss') ||
      newsContent.includes('bharatiya nagarik suraksha sanhita') ||
      newsContent.includes('bsa') ||
      newsContent.includes('bharatiya sakshya adhiniyam') ||
      newsContent.includes('2024') ||
      newsContent.includes('2025');
    
    expect(hasCurrentLegalTerms).toBe(true);
  });

  it("should consistently return current dates across multiple API calls", async () => {
    // Test multiple calls to verify consistent behavior
    const results = [];
    
    for (let i = 0; i < 3; i++) {
      const newsItems = await getLegalNews();
      results.push(newsItems);
    }
    
    // Verify all calls return current dates, not 2022
    results.forEach((newsItems, callIndex) => {
      newsItems.forEach((item, itemIndex) => {
        expect(item.date, `Call ${callIndex + 1}, Item ${itemIndex + 1} should have current date`).toMatch(/2024|2025/);
        expect(item.date, `Call ${callIndex + 1}, Item ${itemIndex + 1} should not have 2022 date`).not.toMatch(/2022/);
      });
    });
  });

  it("should use appropriate AI prompts requesting current dates", async () => {
    await getLegalNews();
    
    // Verify that the API was called with prompts requesting current dates
    expect(mockApiCalls.length).toBeGreaterThan(0);
    
    const lastCall = mockApiCalls[mockApiCalls.length - 1];
    const messages = lastCall.body.messages;
    const userMessage = messages.find((msg: any) => msg.role === 'user');
    
    // On UNFIXED code, the prompt might not be specific enough about current dates
    expect(userMessage.content.toLowerCase()).toMatch(/2024|2025|recent|current|july 2024/);
  });

  it("should handle fallback data with current dates when API fails", async () => {
    // Mock API failure
    global.fetch = vi.fn().mockRejectedValue(new Error('API Error'));
    
    const newsItems = await getLegalNews();
    
    // Even fallback data should have current dates, not 2022
    // On UNFIXED code, fallback data might contain 2022 dates
    expect(newsItems).toBeDefined();
    expect(Array.isArray(newsItems)).toBe(true);
    
    if (newsItems.length > 0) {
      newsItems.forEach((item, index) => {
        expect(item.date, `Fallback item ${index + 1} should not have 2022 date`).not.toMatch(/2022/);
      });
    }
  });

  it("should validate and reject 2022 dates if generated", async () => {
    // This test checks if there's any date validation in the unfixed code
    const newsItems = await getLegalNews();
    
    // On UNFIXED code, there's likely no validation, so 2022 dates pass through
    // This test will fail, proving the bug exists
    const has2022Dates = newsItems.some(item => item.date.includes('2022'));
    
    // This should be false (no 2022 dates), but will be true on unfixed code
    expect(has2022Dates, "News should not contain any 2022 dates").toBe(false);
  });

  it("should generate news with proper structure and current metadata", async () => {
    const newsItems = await getLegalNews();
    
    // Verify structure
    expect(newsItems.length).toBe(5); // Should return exactly 5 items
    
    newsItems.forEach((item, index) => {
      expect(item, `Item ${index + 1} should have title`).toHaveProperty('title');
      expect(item, `Item ${index + 1} should have summary`).toHaveProperty('summary');
      expect(item, `Item ${index + 1} should have date`).toHaveProperty('date');
      expect(item, `Item ${index + 1} should have category`).toHaveProperty('category');
      
      // Verify content quality
      expect(item.title.length, `Item ${index + 1} title should not be empty`).toBeGreaterThan(0);
      expect(item.summary.length, `Item ${index + 1} summary should not be empty`).toBeGreaterThan(0);
      
      // CRITICAL: Verify dates are current
      expect(item.date, `Item ${index + 1} should have current date`).toMatch(/2024|2025/);
    });
  });
});