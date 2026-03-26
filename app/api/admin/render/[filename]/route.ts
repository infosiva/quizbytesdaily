import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";

const RENDERS_DIR = path.join(process.cwd(), "data", "renders");

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Sanitise: strip directory traversal and allow only safe chars
  const safe = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "");
  if (!safe.endsWith(".mp4")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filePath = path.join(RENDERS_DIR, safe);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": buffer.length.toString(),
      "Content-Disposition": `attachment; filename="${safe}"`,
    },
  });
}
