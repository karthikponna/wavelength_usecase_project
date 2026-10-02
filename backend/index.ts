import app from "./app";
import { MODEL } from "./routes/chat";

const port = Number(process.env.PORT ?? 3001);

app.listen(port, () => {
  const key = process.env.ANTHROPIC_API_KEY ? "set" : "MISSING (add it to .env)";
  console.log(`[api] listening on http://localhost:${port} · model ${MODEL} · ANTHROPIC_API_KEY ${key}`);
});
