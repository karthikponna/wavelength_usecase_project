import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import Markdown from "react-markdown";
import { AlertCircle, ArrowUp, RotateCcw, Sparkles, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAssistant, type UIMessage } from "./useAssistant";

const ASK_SUGGESTIONS = [
  "Which account should I work on first today?",
  "What does Signal Rank do?",
  "Which accounts renew in the next 30 days?",
];

function ContextCard({ message }: { message: UIMessage }) {
  const ctx = message.context!;
  return (
    <div className="ml-auto w-[85%] overflow-hidden rounded-2xl rounded-br-md border border-zinc-200 bg-zinc-50">
      {ctx.screenshot && (
        <img src={ctx.screenshot} alt={`Screenshot around ${ctx.label}`} className="max-h-36 w-full border-b border-zinc-200 object-cover object-center" />
      )}
      <div className="px-3 py-2">
        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-orange-600">
          <Sparkles className="size-3" /> Circled: {ctx.label}
        </div>
        <p className="mt-0.5 text-[13px] text-zinc-800">What does this do?</p>
      </div>
    </div>
  );
}

function AssistantMessage({ content, streaming }: { content: string; streaming: boolean }) {
  if (!content) {
    return (
      <div className="flex items-center gap-1 py-2" aria-label="Thinking">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-1.5 rounded-full bg-zinc-400"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    );
  }
  return (
    <div
      className={cn(
        "text-[13.5px] leading-relaxed text-zinc-800 [&_li]:mt-0.5 [&_p+p]:mt-2 [&_p+ul]:mt-1.5 [&_strong]:font-semibold [&_strong]:text-zinc-950 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-0.5 [&_ul]:pl-4 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1",
        streaming && "[&>*:last-child]:after:ml-0.5 [&>*:last-child]:after:inline-block [&>*:last-child]:after:h-3.5 [&>*:last-child]:after:w-1.5 [&>*:last-child]:after:animate-pulse [&>*:last-child]:after:bg-orange-500 [&>*:last-child]:after:align-middle [&>*:last-child]:after:content-['']",
      )}
    >
      <Markdown>{content}</Markdown>
    </div>
  );
}

export function ChatPanel() {
  const { chat, closePanel, sendMessage, retry, stopStreaming, spotlight } = useAssistant();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const messages = chat?.messages ?? [];
  const lastContent = messages[messages.length - 1]?.content;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, lastContent, chat?.error]);

  useEffect(() => {
    if (chat?.mode === "ask") inputRef.current?.focus();
  }, [chat?.mode]);

  if (!chat) return null;

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!draft.trim()) return;
    sendMessage(draft);
    setDraft("");
  };

  const title = chat.mode === "explain" ? spotlight?.label ?? chat.selection?.label ?? "This feature" : "Ask about this page";

  return (
    <motion.section
      data-assistant-ui
      role="dialog"
      aria-label="Wavelength guide"
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
      style={{ transformOrigin: "bottom right" }}
      className="fixed bottom-24 right-6 z-[70] flex h-[min(560px,calc(100vh-8rem))] w-[400px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-zinc-900/10"
    >
      <header className="flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3 text-zinc-900">
        <span className="grid size-8 place-items-center rounded-xl bg-orange-50">
          <Sparkles className="size-4 text-orange-500" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold">Wavelength Guide</div>
          <div className="truncate text-[11px] text-zinc-500">
            {chat.mode === "explain" ? `Explaining ${title}` : title}
          </div>
        </div>
        <button
          type="button"
          aria-label="Close chat"
          onClick={closePanel}
          className="grid size-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
        >
          <X className="size-4" />
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {chat.mode === "ask" && messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-[13px] text-zinc-600">
              Ask anything about this page. I can see your current filters and accounts.
            </p>
            <div className="flex flex-col items-start gap-2">
              {ASK_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendMessage(s)}
                  className="rounded-xl border border-zinc-200 px-3 py-1.5 text-left text-[13px] text-zinc-700 hover:border-orange-300 hover:bg-orange-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            m.context ? (
              <ContextCard key={m.id} message={m} />
            ) : (
              <div key={m.id} className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-zinc-100 px-3 py-2 text-[13.5px] text-zinc-900">
                {m.content}
              </div>
            )
          ) : (
            <AssistantMessage key={m.id} content={m.content} streaming={chat.streaming && i === messages.length - 1} />
          ),
        )}

        {chat.error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-[13px] text-rose-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <div className="space-y-1">
                <p>{chat.error.message}</p>
                {chat.error.code === "missing_key" && (
                  <p className="text-rose-700/80">
                    Copy <code className="rounded bg-rose-100 px-1">.env.example</code> to{" "}
                    <code className="rounded bg-rose-100 px-1">.env</code>, paste your key, then restart{" "}
                    <code className="rounded bg-rose-100 px-1">bun run dev</code>.
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={retry}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-xs font-medium hover:bg-rose-100"
            >
              <RotateCcw className="size-3" /> Try again
            </button>
          </div>
        )}
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 border-t border-zinc-200 p-3">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={chat.mode === "explain" ? "Ask a follow-up..." : "Ask about this page..."}
          className="h-9 flex-1 rounded-xl border border-zinc-200 px-3 text-[13px] outline-none focus:border-zinc-400"
        />
        {chat.streaming ? (
          <button
            type="button"
            aria-label="Stop answering"
            onClick={stopStreaming}
            className="grid size-9 place-items-center rounded-xl bg-zinc-900 text-white hover:bg-zinc-700"
          >
            <Square className="size-3.5 fill-current" />
          </button>
        ) : (
          <button
            type="submit"
            aria-label="Send"
            disabled={!draft.trim()}
            className="grid size-9 place-items-center rounded-xl bg-orange-500 text-white transition-colors hover:bg-orange-400 disabled:bg-zinc-200 disabled:text-zinc-400"
          >
            <ArrowUp className="size-4" />
          </button>
        )}
      </form>
    </motion.section>
  );
}
