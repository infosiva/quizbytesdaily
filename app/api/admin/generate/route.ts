import { NextRequest, NextResponse } from "next/server";
import { generateQuizSeries } from "@/lib/quiz-generator";
import { createSeries, insertSlides, getSeriesBySlug } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, category, difficulty } = body as {
      topic: string;
      category: string;
      difficulty: string;
    };

    if (!topic || !category || !difficulty) {
      return NextResponse.json(
        { error: "topic, category, and difficulty are required" },
        { status: 400 }
      );
    }

    // Generate with Claude
    const generated = await generateQuizSeries(topic, category, difficulty);

    // Ensure unique slug
    let slug = generated.slug;
    if (getSeriesBySlug(slug)) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    // Save to DB
    const series = createSeries({
      slug,
      title: generated.title,
      topic: generated.topic,
      category: generated.category,
      difficulty: generated.difficulty,
    });

    insertSlides(
      series.id,
      generated.slides.map((s) => ({ template: s.template, data: s.data }))
    );

    return NextResponse.json({ success: true, series, slides: generated.slides });
  } catch (err) {
    console.error("[generate]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }
}
