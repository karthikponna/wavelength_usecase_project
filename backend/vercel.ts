import type { IncomingMessage, ServerResponse } from "node:http";
import app from "./app";

/** Vercel entrypoint. The route in config.json passes the original sub-path as ?__path=. */
export default function handler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", "http://localhost");
  const path = url.searchParams.get("__path");
  if (path !== null) {
    url.searchParams.delete("__path");
    req.url = `/api/${path}${url.search}`;
  }
  return app(req as Parameters<typeof app>[0], res as Parameters<typeof app>[1]);
}
