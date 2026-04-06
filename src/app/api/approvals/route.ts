import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    const dataDir = join(process.cwd(), "data");
    const raw = await readFile(join(dataDir, "approvals.json"), "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json({ approvals: data.approvals ?? [] });
  } catch {
    return NextResponse.json({ approvals: [] });
  }
}
