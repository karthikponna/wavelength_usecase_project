import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ChatMessage, ChatMode, ChatRequest, Selection, WhatsNewItem } from "@shared/types";
import { PAGE } from "@/dashboard/Dashboard";
import { useDashboard } from "@/dashboard/state";
import { captureRegion } from "@/lib/capture";
import { collectPage, collectSelection, describeElement } from "@/lib/collect-context";
import { detectTarget, type DetectedTarget } from "@/lib/detect-target";
import type { Point } from "@/lib/geometry";
import { streamChat } from "@/lib/stream-chat";

export type SpotlightState = {
  target: DetectedTarget;
  label: string;
  /** confirm: blurred page with Send/Cancel. pinned: ring only while the chat is open. */
  mode: "confirm" | "pinned";
};

export type UIMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  context?: { label: string; screenshot?: string };
};

export type ChatState = {
  mode: ChatMode;
  selection?: Omit<Selection, "screenshot">;
  messages: UIMessage[];
  streaming: boolean;
  error: { message: string; code?: string } | null;
};

type Panel = "chat" | "whatsNew" | null;

type AssistantContextValue = {
  markerOn: boolean;
  startMarker: () => void;
  stopMarker: () => void;
  handleStroke: (points: Point[]) => boolean;
  spotlight: SpotlightState | null;
  spotlightElement: (el: HTMLElement) => void;
  cancelSelection: () => void;
  sendSelection: () => Promise<void>;
  panel: Panel;
  openAsk: () => void;
  openWhatsNew: () => void;
  closePanel: () => void;
  chat: ChatState | null;
  sendMessage: (text: string) => void;
  retry: () => void;
  stopStreaming: () => void;
  features: WhatsNewItem[];
};

const AssistantContext = createContext<AssistantContextValue | null>(null);

let idCounter = 0;
const nextId = () => `m${++idCounter}`;

export function AssistantProvider({ children }: { children: ReactNode }) {
  const { getLiveState } = useDashboard();
  const [markerOn, setMarkerOn] = useState(false);
  const [spotlight, setSpotlight] = useState<SpotlightState | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [chat, setChat] = useState<ChatState | null>(null);
  const [features, setFeatures] = useState<WhatsNewItem[]>([]);

  const screenshotRef = useRef<Promise<string | undefined> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sendingRef = useRef(false);
  const chatRef = useRef<ChatState | null>(null);
  chatRef.current = chat;

  useEffect(() => {
    fetch("/api/features")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: WhatsNewItem[]) => setFeatures(list))
      .catch(() => setFeatures([]));
  }, []);

  const labelFor = useCallback(
    (target: DetectedTarget) =>
      features.find((f) => f.id === target.featureId)?.name ?? describeElement(target.element),
    [features],
  );

  const select = useCallback(
    (target: DetectedTarget) => {
      setSpotlight({ target, label: labelFor(target), mode: "confirm" });
      screenshotRef.current = captureRegion(target.element.getBoundingClientRect());
    },
    [labelFor],
  );

  const cancelSelection = useCallback(() => {
    setSpotlight(null);
    screenshotRef.current = null;
  }, []);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setChat((c) => (c ? { ...c, streaming: false } : c));
  }, []);

  const startMarker = useCallback(() => {
    stopStreaming();
    setPanel(null);
    setSpotlight(null);
    setMarkerOn(true);
  }, [stopStreaming]);

  const stopMarker = useCallback(() => {
    setMarkerOn(false);
    setSpotlight((s) => (s?.mode === "confirm" ? null : s));
  }, []);

  const handleStroke = useCallback(
    (points: Point[]) => {
      const target = detectTarget(points);
      if (!target) return false;
      select(target);
      return true;
    },
    [select],
  );

  const spotlightElement = useCallback(
    (el: HTMLElement) => {
      setPanel(null);
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      select({ element: el, featureId: el.dataset.feature ?? null, candidates: [] });
    },
    [select],
  );

  const run = useCallback(
    (request: ChatRequest) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const assistantId = nextId();

      setChat((c) =>
        c
          ? {
              ...c,
              streaming: true,
              error: null,
              messages: [...c.messages, { id: assistantId, role: "assistant", content: "" }],
            }
          : c,
      );

      void streamChat(
        request,
        (event) => {
          if (controller.signal.aborted) return;
          if (event.type === "text") {
            setChat((c) =>
              c
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === assistantId ? { ...m, content: m.content + event.text } : m,
                    ),
                  }
                : c,
            );
          } else if (event.type === "done") {
            setChat((c) => (c ? { ...c, streaming: false } : c));
          } else {
            setChat((c) =>
              c
                ? {
                    ...c,
                    streaming: false,
                    error: { message: event.message, code: event.code },
                    messages: c.messages.filter((m) => !(m.id === assistantId && m.content === "")),
                  }
                : c,
            );
          }
        },
        controller.signal,
      ).finally(() => {
        if (abortRef.current === controller) abortRef.current = null;
        setChat((c) => (c?.streaming ? { ...c, streaming: false } : c));
      });
    },
    [],
  );

  const toApiMessages = (messages: UIMessage[]): ChatMessage[] =>
    messages.filter((m) => m.content.trim() !== "").map(({ role, content }) => ({ role, content }));

  const sendSelection = useCallback(async () => {
    if (spotlight?.mode !== "confirm" || sendingRef.current) return;
    sendingRef.current = true;
    const { target, label } = spotlight;
    const selection = collectSelection(target, label);
    const page = collectPage(PAGE, getLiveState());
    const screenshot = (await screenshotRef.current) ?? undefined;
    sendingRef.current = false;

    const question: UIMessage = {
      id: nextId(),
      role: "user",
      content: `What does "${label}" do? Explain it using what's on my screen right now.`,
      context: { label, screenshot },
    };

    setMarkerOn(false);
    setSpotlight({ ...spotlight, mode: "pinned" });
    setPanel("chat");
    const next: ChatState = { mode: "explain", selection, messages: [question], streaming: true, error: null };
    setChat(next);
    chatRef.current = next;

    run({
      mode: "explain",
      page,
      selection: { ...selection, screenshot },
      messages: toApiMessages([question]),
    });
  }, [spotlight, getLiveState, run]);

  const sendMessage = useCallback(
    (text: string) => {
      const current = chatRef.current;
      if (!current || !text.trim() || current.streaming) return;
      const userMsg: UIMessage = { id: nextId(), role: "user", content: text.trim() };
      const messages = [...current.messages, userMsg];
      setChat({ ...current, messages, error: null });
      run({
        mode: current.mode,
        page: collectPage(PAGE, getLiveState()),
        selection: current.selection,
        messages: toApiMessages(messages),
      });
    },
    [getLiveState, run],
  );

  const retry = useCallback(() => {
    const current = chatRef.current;
    if (!current || current.streaming) return;
    const last = current.messages[current.messages.length - 1];
    if (last?.role !== "user") return;
    const screenshot = current.messages.length === 1 ? last.context?.screenshot : undefined;
    run({
      mode: current.mode,
      page: collectPage(PAGE, getLiveState()),
      selection: current.selection ? { ...current.selection, screenshot } : undefined,
      messages: toApiMessages(current.messages),
    });
  }, [getLiveState, run]);

  const openAsk = useCallback(() => {
    stopStreaming();
    setMarkerOn(false);
    setSpotlight(null);
    setChat({ mode: "ask", messages: [], streaming: false, error: null });
    setPanel("chat");
  }, [stopStreaming]);

  const openWhatsNew = useCallback(() => {
    stopStreaming();
    setMarkerOn(false);
    setSpotlight(null);
    setPanel("whatsNew");
  }, [stopStreaming]);

  const closePanel = useCallback(() => {
    stopStreaming();
    setPanel(null);
    setSpotlight(null);
    setChat(null);
  }, [stopStreaming]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (e.key === "Escape") {
        if (spotlight?.mode === "confirm") cancelSelection();
        else if (markerOn) stopMarker();
        else if (panel) closePanel();
      } else if (e.key === "Enter" && !typing && spotlight?.mode === "confirm") {
        e.preventDefault();
        void sendSelection();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [spotlight, markerOn, panel, cancelSelection, stopMarker, closePanel, sendSelection]);

  useEffect(() => {
    if (!markerOn) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [markerOn]);

  const value = useMemo<AssistantContextValue>(
    () => ({
      markerOn,
      startMarker,
      stopMarker,
      handleStroke,
      spotlight,
      spotlightElement,
      cancelSelection,
      sendSelection,
      panel,
      openAsk,
      openWhatsNew,
      closePanel,
      chat,
      sendMessage,
      retry,
      stopStreaming,
      features,
    }),
    [markerOn, startMarker, stopMarker, handleStroke, spotlight, spotlightElement, cancelSelection, sendSelection, panel, openAsk, openWhatsNew, closePanel, chat, sendMessage, retry, stopStreaming, features],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error("useAssistant must be used inside AssistantProvider");
  return ctx;
}
