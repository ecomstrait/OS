import { NextResponse } from "next/server";
import { askEcomAI, type ChatMessage } from "@/lib/ask";

export async function POST(req: Request) {
  let body: { messages?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const raw = Array.isArray(body.messages) ? body.messages : [];
  const messages: ChatMessage[] = raw
    .map((m): ChatMessage | null => {
      if (!m || typeof m !== "object") return null;
      const role = (m as { role?: unknown }).role;
      const content = (m as { content?: unknown }).content;
      if (typeof content !== "string" || !content.trim()) return null;
      return {
        role: role === "assistant" ? "assistant" : "user",
        content: content.trim().slice(0, 500),
      };
    })
    .filter((m): m is ChatMessage => m !== null)
    .slice(-8);

  const hasUser = messages.some((m) => m.role === "user");
  if (!hasUser) {
    return NextResponse.json({ error: "Ask EcomAI a question." }, { status: 400 });
  }

  const result = await askEcomAI(messages);
  return NextResponse.json(result);
}
