import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    const dataDir = join(process.cwd(), "data");
    const raw = await readFile(join(dataDir, "feedback.json"), "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json({ feedback: data.feedback ?? [] });
  } catch {
    return NextResponse.json({ feedback: [] });
  }
}
