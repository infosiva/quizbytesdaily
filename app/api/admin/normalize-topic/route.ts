import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export const runtime    = "nodejs";
export const maxDuration = 15;

export async function POST(req: NextRequest) {
  try {
    const { topic } = (await req.json()) as { topic?: string };
    if (!topic?.trim() || topic.trim().length < 3) {
      return NextResponse.json({ normalized: topic ?? "" });
    }

    const raw = topic.trim();

    // If it already looks like a clean short title (≤6 words, no question marks/typos) skip the call
    const wordCount = raw.split(/\s+/).length;
    const hasQuestion = /\?|^(why|how|what|when|where|is|are|can|should|would)\s/i.test(raw);
    const looksClean = wordCount <= 6 && !hasQuestion;
    if (looksClean) {
      return NextResponse.json({ normalized: raw });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ normalized: raw });
    }

    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const chat = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      max_tokens: 30,
      messages: [
        {
          role: "user",
          content: `Convert this to a clean, concise tech topic title (fix typos, rephrase questions as noun titles, max 6 words). Reply with ONLY the title, nothing else.\n\nInput: "${raw}"`,
        },
      ],
    });

    const normalized = chat.choices[0]?.message?.content?.trim().replace(/^["']|["']$/g, "") ?? raw;
    return NextResponse.json({ normalized });
  } catch {
    return NextResponse.json({ normalized: "" });
  }
}
