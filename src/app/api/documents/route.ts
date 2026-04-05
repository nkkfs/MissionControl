import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    const raw = await readFile(join(process.cwd(), "data", "documents.json"), "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json({ documents: data.documents ?? [] });
  } catch {
    return NextResponse.json({ documents: [] });
  }
}
