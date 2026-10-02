export type FeatureEntry = {
  id: string;
  name: string;
  page: string;
  location: string;
  whatItDoes: string;
  howToUse: string[];
  options?: string[];
  example?: string;
  relatedFeatures?: string[];
  liveDataKeys?: string[];
  shippedOn: string;
  isNew?: boolean;
};

export type ChatMode = "explain" | "ask";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type PageContext = {
  id: string;
  title: string;
  visibleFeatureIds: string[];
  liveState: Record<string, unknown>;
};

export type Selection = {
  featureId: string | null;
  label: string;
  tag: string;
  role?: string;
  text: string;
  ariaLabel?: string;
  nearbyText: string;
  candidates: string[];
  /** JPEG data URL of the area around the selected element. */
  screenshot?: string;
};

export type ChatRequest = {
  mode: ChatMode;
  page: PageContext;
  selection?: Selection;
  messages: ChatMessage[];
};

export type StreamEvent =
  | { type: "text"; text: string }
  | { type: "done" }
  | { type: "error"; message: string; code?: "missing_key" | "bad_request" | "upstream" };

export type WhatsNewItem = Pick<
  FeatureEntry,
  "id" | "name" | "whatItDoes" | "location" | "shippedOn" | "isNew"
>;

export type HealthResponse = {
  ok: true;
  hasKey: boolean;
  model: string;
};
