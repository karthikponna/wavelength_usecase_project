import express from "express";
import type { HealthResponse } from "../shared/types";
import { summaries, whatsNew } from "./registry";
import { MODEL, chatHandler } from "./routes/chat";

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "8mb" }));

app.get("/api/health", (_req, res) => {
  const body: HealthResponse = { ok: true, hasKey: Boolean(process.env.ANTHROPIC_API_KEY), model: MODEL };
  res.json(body);
});

app.get("/api/features", (_req, res) => {
  res.json(summaries());
});

app.get("/api/features/whats-new", (_req, res) => {
  res.json(whatsNew());
});

app.post("/api/chat", chatHandler);

export default app;
