import { NextRequest, NextResponse } from "next/server";
import { askOpenAI } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const { apiKey, model, messages } = await req.json();
    if (!apiKey || !model || !messages) {
      return NextResponse.json({ error: "Missing API key, model, or messages" }, { status: 400 });
    }
    const answer = await askOpenAI({apiKey, model, messages});
    return NextResponse.json({ answer });
  } catch (err: any) {
    console.error("OpenAI API error:", err);
    const message = err?.response?.data?.error?.message || err.message || "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
