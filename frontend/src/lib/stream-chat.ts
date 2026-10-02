import type { ChatRequest, StreamEvent } from "@shared/types";

type ErrorCode = Extract<StreamEvent, { type: "error" }>["code"];

export async function streamChat(
  body: ChatRequest,
  onEvent: (e: StreamEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch {
    if (signal.aborted) return;
    onEvent({ type: "error", message: "Couldn't reach the assistant server. Is it running?", code: "upstream" });
    return;
  }

  if (!res.ok || !res.body) {
    const data = (await res.json().catch(() => null)) as { error?: string; code?: ErrorCode } | null;
    onEvent({ type: "error", message: data?.error ?? `Request failed (${res.status})`, code: data?.code });
    return;
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      let idx: number;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const chunk = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) onEvent(JSON.parse(line.slice(6)) as StreamEvent);
        }
      }
    }
  } catch {
    if (!signal.aborted) onEvent({ type: "error", message: "The connection dropped mid-answer.", code: "upstream" });
  }
}
