import { toCanvas } from "html-to-image";

const PADDING = 80;
const MAX_WIDTH = 900;

function isAssistantNode(node: Node): boolean {
  return node instanceof HTMLElement && node.dataset.assistantUi !== undefined;
}

/** JPEG data URL of the page around `rect`, excluding the assistant overlays. */
export async function captureRegion(rect: DOMRect): Promise<string | undefined> {
  const root = document.getElementById("root");
  if (!root) return undefined;

  try {
    const rootRect = root.getBoundingClientRect();
    const full = await toCanvas(root, {
      pixelRatio: 1,
      skipFonts: true,
      cacheBust: false,
      filter: (node) => !isAssistantNode(node),
    });

    const sx = Math.max(0, rect.left - rootRect.left - PADDING);
    const sy = Math.max(0, rect.top - rootRect.top - PADDING);
    const sw = Math.min(full.width - sx, rect.width + PADDING * 2);
    const sh = Math.min(full.height - sy, rect.height + PADDING * 2);
    if (sw <= 0 || sh <= 0) return undefined;

    const scale = Math.min(1, MAX_WIDTH / sw);
    const out = document.createElement("canvas");
    out.width = Math.round(sw * scale);
    out.height = Math.round(sh * scale);
    const ctx = out.getContext("2d");
    if (!ctx) return undefined;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(full, sx, sy, sw, sh, 0, 0, out.width, out.height);
    return out.toDataURL("image/jpeg", 0.82);
  } catch (err) {
    console.warn("Screenshot capture failed; continuing without an image.", err);
    return undefined;
  }
}
