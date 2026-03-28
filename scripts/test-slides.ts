/**
 * Test script — generate PNG slides locally without a web server.
 * Usage:  npx tsx scripts/test-slides.ts
 *
 * Outputs slides to: /tmp/qbd-test-slides/
 */

import fs from "fs";
import path from "path";

// Load .env.local so API keys are available
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

import { generateQuizSeries } from "../lib/quiz-generator";
import { slideToPng } from "../lib/slide-svg";

const OUT_DIR = "/tmp/qbd-test-slides";
fs.mkdirSync(OUT_DIR, { recursive: true });

async function main() {
  console.log("Generating quiz series for topic: 'Python List Comprehensions'…\n");

  const series = await generateQuizSeries("Python List Comprehensions", "Python", "Beginner");

  console.log(`Title: ${series.title}`);
  console.log(`Slides: ${series.slides.length}\n`);

  for (let i = 0; i < series.slides.length; i++) {
    // LLM returns flat objects; template is top-level, everything else is the slide data
    const { template, ...rest } = series.slides[i] as unknown as Record<string, unknown>;
    const data = { ...rest, slideNum: i + 1, totalSlides: series.slides.length };

    process.stdout.write(`  Rendering slide ${i + 1}/${series.slides.length} [${String(template)}]…`);
    const png     = await slideToPng(String(template), data);
    const outPath = path.join(OUT_DIR, `slide_${String(i + 1).padStart(2, "0")}.png`);
    fs.writeFileSync(outPath, png);
    console.log(` ✓  ${(png.length / 1024).toFixed(0)} KB  →  ${outPath}`);
  }

  console.log(`\nDone! Open ${OUT_DIR} to view the slides.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
