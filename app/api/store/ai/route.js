import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { genAI } from "@/configs/gemini";

async function generateProduct(base64Image, mimeType) {

  // Remove base64 header if present
  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    systemInstruction: `
You are an AI product listing generator.

Analyze the product image and generate structured JSON.

Return ONLY valid JSON.

Schema:
{
  "name": string,
  "description": string
}
`
  });

  const prompt =
    "Generate a short product name and a professional ecommerce description.";

  const imagePart = {
    inlineData: {
      data: cleanBase64,
      mimeType: mimeType,
    },
  };

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }, imagePart],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 500,
      responseMimeType: "application/json",
    },
  });

  const text = result.response.text();

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini raw output:", text);
    throw new Error("AI returned invalid JSON");
  }
}

export async function POST(request) {
  try {

    const { userId } = getAuth(request);

    const isSeller = await authSeller(userId);

    if (!isSeller) {
      return NextResponse.json(
        { error: "Not authorized. Seller account required." },
        { status: 401 }
      );
    }

    const { base64Image, mimeType } = await request.json();

    if (!base64Image || !mimeType) {
      return NextResponse.json(
        { error: "Missing image or mimeType" },
        { status: 400 }
      );
    }

    const result = await generateProduct(base64Image, mimeType);

    return NextResponse.json(result);

  } catch (error) {

    console.error("Route Error:", error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}