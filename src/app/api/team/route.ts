import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    const dataDir = join(process.cwd(), "data");

    let agents = [];
    try {
      const raw = await readFile(join(dataDir, "agents.json"), "utf-8");
      agents = JSON.parse(raw).agents ?? [];
    } catch {
      agents = [];
    }

    let mission = "";
    try {
      mission = await readFile(join(dataDir, "mission.md"), "utf-8");
    } catch {
      mission = "";
    }

    return NextResponse.json({ agents, mission });
  } catch {
    return NextResponse.json({ agents: [], mission: "" });
  }
}
