import { GoogleGenerativeAI } from "@google/generative-ai";

// Google Gemini AI configuration
export const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
export const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
