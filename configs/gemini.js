import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI with your API Key
export const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);