import { NextRequest, NextResponse } from "next/server";
import { getSeriesBySlug, getSlides } from "@/lib/db";
import { buildThumbnailJpeg } from "@/lib/thumbnail-svg";

export const runtime    = "nodejs";
export const maxDuration = 30;

/** Extract the first quiz question from the series slides. */
function extractFirstQuestion(slides: Array<{ template: string; data: unknown }>): string | undefined {
  for (const slide of slides) {
    const d = slide.data as Record<string, unknown>;
    // code-quiz slides have a "question" field
    if (slide.template === "code-quiz" && typeof d.question === "string" && d.question.trim()) {
      return d.question.trim();
    }
    // definition-steps slides where title ends with "?" are the quiz question slide
    if (slide.template === "definition-steps" && typeof d.title === "string" && d.title.trim().endsWith("?")) {
      return d.title.trim();
    }
    // quiz-reveal or any slide with a "q" field (inline quiz data)
    if (typeof d.q === "string" && d.q.trim()) {
      return d.q.trim();
    }
  }
  return undefined;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const series   = await getSeriesBySlug(slug);
  if (!series) return new NextResponse("Not found", { status: 404 });

  // Fetch slides to get the first quiz question for context-aware thumbnail
  let question: string | undefined;
  try {
    const slides = await getSlides(series.id);
    question = extractFirstQuestion(slides);
  } catch {
    // If slides fail, proceed without question
  }

  const jpeg = await buildThumbnailJpeg(series.title, series.category, series.difficulty, question);

  return new NextResponse(new Uint8Array(jpeg), {
    headers: {
      "Content-Type":  "image/jpeg",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=600",
    },
  });
}
