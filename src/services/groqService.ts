/**
 * groqService.ts — compatibility shim
 *
 * All AI logic has been moved to aiService.ts so you can plug in your
 * own Indian Law AI backend without touching individual pages.
 *
 * This file simply re-exports everything from aiService.ts so that
 * existing imports across the codebase continue to work unchanged.
 */
export * from "./aiService";
