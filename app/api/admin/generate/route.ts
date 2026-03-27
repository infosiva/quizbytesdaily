import { NextRequest, NextResponse } from "next/server";
import { generateQuizSeries, type LayoutId } from "@/lib/quiz-generator";
import { createSeries, insertSlides, getSeriesBySlug } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, category, difficulty, layout } = body as {
      topic: string;
      category: string;
      difficulty: string;
      layout?: LayoutId;
    };

    if (!topic || !category || !difficulty) {
      return NextResponse.json(
        { error: "topic, category, and difficulty are required" },
        { status: 400 }
      );
    }

    const generated = await generateQuizSeries(topic, category, difficulty, layout ?? "quiz-reveal");

    // Ensure unique slug
    let slug = generated.slug;
    if (await getSeriesBySlug(slug)) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    // Save to DB
    const series = await createSeries({
      slug,
      title: generated.title,
      topic: generated.topic,
      category: generated.category,
      difficulty: generated.difficulty,
    });

    // The LLM returns flat slide objects: { template, heading, cards, ... }
    // We store template separately; everything else goes into the data column.
    await insertSlides(
      series.id,
      generated.slides.map((s) => {
        const { template, ...rest } = s as unknown as Record<string, unknown>;
        return { template: String(template ?? "unknown"), data: rest };
      })
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
