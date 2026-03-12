import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { model } from "@/configs/openai";

async function main(base64Image, mimeType) {
  const prompt = `You are a product listing assistant for an e-commerce store. Your job is to analyze an image of a product and generate structured data.

Analyze this image and return a product name and marketing-friendly description.

Respond ONLY with raw JSON (no code block, no markdown, no explanation).
The JSON must strictly follow this schema:

{
  "name": string,            // Short product name
  "description": string      // Marketing-friendly description of the product
}`;

  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: mimeType,
    },
  };

  const result = await model.generateContent([prompt, imagePart]);
  const response = await result.response;
  const raw = response.text();

  // Remove ```json or ``` wrappers if present
  const cleaned = raw.replace(/```json|```/g, "").trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    throw new Error("Failed to parse JSON response from AI");
  }
  return parsed;
}

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const isSeller = await authSeller(userId);

    if (!isSeller) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    const { base64Image, mimeType } = await request.json();
    const result = await main(base64Image, mimeType);

    return NextResponse.json({ ...result });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}
