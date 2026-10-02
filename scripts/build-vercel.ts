// Writes a Vercel Build Output API (v3) bundle: the Vite site as static files
// and the Express backend bundled into a single Node function at /api.
import { cp, mkdir, rm, writeFile } from "node:fs/promises";

const out = ".vercel/output";
const fn = `${out}/functions/api.func`;

await rm(out, { recursive: true, force: true });
await mkdir(fn, { recursive: true });
await cp("dist", `${out}/static`, { recursive: true });

const result = await Bun.build({
  entrypoints: ["backend/vercel.ts"],
  outdir: fn,
  naming: "index.mjs",
  target: "node",
  format: "esm",
});
if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

await writeFile(
  `${fn}/.vc-config.json`,
  JSON.stringify(
    {
      runtime: "nodejs22.x",
      handler: "index.mjs",
      launcherType: "Nodejs",
      shouldAddHelpers: false,
      supportsResponseStreaming: true,
      maxDuration: 60,
    },
    null,
    2,
  ),
);

await writeFile(
  `${out}/config.json`,
  JSON.stringify(
    {
      version: 3,
      routes: [{ src: "^/api/(.*)$", dest: "/api?__path=$1" }, { handle: "filesystem" }],
    },
    null,
    2,
  ),
);

console.log("Wrote .vercel/output (static site + /api function)");
