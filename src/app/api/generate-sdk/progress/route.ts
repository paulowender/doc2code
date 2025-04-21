import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";

// Store progress information in memory (in a real app, this would be in a database or Redis)
const progressStore: Record<string, { current: number; total: number; status: string }> = {};

export async function POST(request: NextRequest) {
  try {
    const { sessionId, current, total, status } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }
    
    // Update progress
    progressStore[sessionId] = { current, total, status };
    logger.info(`Progress updated for session ${sessionId}`, { current, total, status });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error updating progress", error);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("sessionId");
    
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }
    
    // Get progress
    const progress = progressStore[sessionId] || { current: 0, total: 0, status: "idle" };
    
    return NextResponse.json(progress);
  } catch (error) {
    logger.error("Error getting progress", error);
    return NextResponse.json({ error: "Failed to get progress" }, { status: 500 });
  }
}
