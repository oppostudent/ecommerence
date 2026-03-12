import OpenAI from "openai";

// Uses Vercel AI Gateway - no API key needed for supported providers
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy", // AI Gateway handles auth
  baseURL: process.env.OPENAI_BASE_URL || "https://gateway.ai.cloudflare.com/v1/vercel/ai-gateway/openai"
});
