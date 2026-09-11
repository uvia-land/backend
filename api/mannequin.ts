import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

// Prompt tuned to produce a clean, consistent grayscale mannequin from
// any input pose/body shape.
const PROMPT = `
Turn this person into a grayscale mannequin on a flat white background.
Keep the exact body proportions and pose.
The mannequin shouldn't be wearing any clothes.
The mannequin should be on a flat white background.
`;

const MODEL = "gemini-2.5-flash-image";

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? "https://uvia.land";

function setCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function decodeImage(image: string): { mimeType: string; data: string } {
  const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
  if (match) return { mimeType: match[1], data: match[2] };
  return { mimeType: "image/jpeg", data: image };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { image } = (req.body ?? {}) as { image?: string };
  if (typeof image !== "string" || !image) {
    res.status(400).json({ error: 'Missing "image" field' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server misconfigured: GEMINI_API_KEY not set" });
    return;
  }

  try {
    const { mimeType, data } = decodeImage(image);
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ text: PROMPT }, { inlineData: { mimeType, data } }],
      config: { responseModalities: ["TEXT", "IMAGE"] },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p) => p.inlineData?.data);

    if (!imagePart?.inlineData?.data) {
      res.status(502).json({ error: "No image returned from Gemini" });
      return;
    }

    res.status(200).json({
      success: true,
      image: `data:${imagePart.inlineData.mimeType ?? "image/png"};base64,${imagePart.inlineData.data}`,
    });
  } catch (err) {
    console.error("Gemini request failed:", err);
    res.status(500).json({ error: "Generation failed" });
  }
}
