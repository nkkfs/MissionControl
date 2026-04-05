import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    const raw = await readFile(join(process.cwd(), "data", "schedule.json"), "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json({ events: data.events ?? [] });
  } catch {
    return NextResponse.json({ events: [] });
  }
}
