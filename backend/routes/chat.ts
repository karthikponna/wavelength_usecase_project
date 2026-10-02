import Anthropic from "@anthropic-ai/sdk";
import type { Request, Response } from "express";
import type { ChatRequest, StreamEvent } from "../../shared/types";
import { buildMessages, buildSystemPrompt } from "../prompt";

export const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
const MAX_MESSAGES = 20;
const MAX_SCREENSHOT_CHARS = 6_000_000;

let client: Anthropic | null = null;
function getClient(apiKey: string) {
  client ??= new Anthropic({ apiKey });
  return client;
}

function validate(body: unknown): { ok: true; req: ChatRequest } | { ok: false; error: string } {
  const b = body as Partial<ChatRequest> | null;
  if (!b || (b.mode !== "explain" && b.mode !== "ask")) return { ok: false, error: "mode must be 'explain' or 'ask'." };
  if (!b.page || typeof b.page.id !== "string" || !Array.isArray(b.page.visibleFeatureIds))
    return { ok: false, error: "page context is missing." };
  if (!Array.isArray(b.messages) || b.messages.length === 0) return { ok: false, error: "messages are required." };
  const last = b.messages[b.messages.length - 1];
  if (last?.role !== "user" || typeof last.content !== "string" || !last.content.trim())
    return { ok: false, error: "The last message must be a non-empty user message." };
  if (b.mode === "explain" && !b.selection) return { ok: false, error: "explain mode needs a selection." };
  if (b.selection?.screenshot && b.selection.screenshot.length > MAX_SCREENSHOT_CHARS)
    return { ok: false, error: "Screenshot is too large." };
  return {
    ok: true,
    req: {
      mode: b.mode,
      page: { ...b.page, title: b.page.title ?? "", liveState: b.page.liveState ?? {} },
      selection: b.selection,
      messages: b.messages.slice(-MAX_MESSAGES).filter((m) => m.role === "user" || m.role === "assistant"),
    },
  };
}

function describeUpstreamError(err: unknown): string {
  if (err instanceof Anthropic.APIError) {
    if (err.status === 401) return "The Anthropic API key was rejected. Check ANTHROPIC_API_KEY in .env.";
    if (err.status === 404) return `The model "${MODEL}" isn't available for this API key. Set ANTHROPIC_MODEL in .env.`;
    if (err.status === 429) return "Claude is rate limited right now. Try again in a moment.";
    if (err.status && err.status >= 500) return "Claude is having trouble right now. Try again in a moment.";
    return `Claude returned an error: ${err.message}`;
  }
  return "Something went wrong while talking to Claude.";
}

export async function chatHandler(req: Request, res: Response) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(503).json({
      error: "ANTHROPIC_API_KEY isn't set. Add it to .env and restart the server.",
      code: "missing_key",
    });
    return;
  }

  const parsed = validate(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error, code: "bad_request" });
    return;
  }
  const chat = parsed.req;
  const { screenshot, ...selection } = chat.selection ?? {};
  const promptReq: ChatRequest = { ...chat, selection: chat.selection ? (selection as ChatRequest["selection"]) : undefined };

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
  const send = (e: StreamEvent) => res.write(`data: ${JSON.stringify(e)}\n\n`);

  const stream = getClient(apiKey).messages.stream({
    model: MODEL,
    max_tokens: 1024,
    system: buildSystemPrompt(promptReq),
    messages: buildMessages(promptReq, screenshot),
  });

  let clientGone = false;
  res.on("close", () => {
    if (!res.writableEnded) {
      clientGone = true;
      stream.abort();
    }
  });

  stream.on("text", (text) => send({ type: "text", text }));

  try {
    await stream.finalMessage();
    send({ type: "done" });
  } catch (err) {
    if (clientGone) return;
    console.error("[chat] Claude request failed:", err);
    send({ type: "error", message: describeUpstreamError(err), code: "upstream" });
  } finally {
    if (!res.writableEnded) res.end();
  }
}
