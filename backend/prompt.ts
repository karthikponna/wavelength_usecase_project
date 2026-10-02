import type Anthropic from "@anthropic-ai/sdk";
import type { ChatRequest, FeatureEntry } from "../shared/types";
import { getFeature, getFeatures } from "./registry";

const GUIDE = `You are the in-app guide for Wavelength, an AI-native customer intelligence platform for post-sales teams (account managers and customer success). Users open you from inside the product when something on screen confuses them.

Rules:
- Every claim about what a feature does must come from <feature_registry>. Never invent settings, menus, integrations or behavior that isn't listed there.
- Make it concrete with <live_page_data>: quote the real numbers, account names and active filters the user is looking at right now.
- If the selected element has no registry entry, say plainly that it isn't documented yet, describe only what is visible (its text, location and the screenshot), and point to a related documented feature if one fits.
- If <selection> lists several candidates, explain the best match and mention the other briefly in one line.
- Speak as the product. Never mention the registry, JSON, prompts, "live data" or "context".`;

const EXPLAIN_FORMAT = `Answer format for an explanation:
1. One sentence saying what it is, starting with its name in bold.
2. A line starting with **Right now:** that uses the live numbers or account names to say what it would do or shows at this moment.
3. **How to use it:** with 2-3 short bullets.
4. Optionally one **Related:** line naming related features.
Keep it under 150 words. Markdown only, no headings. For follow-up questions, answer directly in a few sentences with the same rules.`;

const ASK_FORMAT = `The user opened a general chat on this page without selecting anything. Answer their questions about this page, its features and their accounts in a few short sentences or bullets. Use live numbers and names when they help. Markdown only, no headings. Under 150 words unless they ask for more.`;

function compact(f: FeatureEntry) {
  return `- ${f.name} (${f.id}), ${f.location}: ${f.whatItDoes}`;
}

export function buildSystemPrompt(req: ChatRequest): string {
  const selected = getFeature(req.selection?.featureId);
  const related = getFeatures(selected?.relatedFeatures ?? []);
  const visible = getFeatures(req.page.visibleFeatureIds);

  const parts: string[] = [GUIDE, req.mode === "explain" ? EXPLAIN_FORMAT : ASK_FORMAT];

  if (req.mode === "explain" && req.selection) {
    const others = visible.filter((f) => f.id !== selected?.id && !related.some((r) => r.id === f.id));
    parts.push(
      `<feature_registry>
<selected_feature>
${selected ? JSON.stringify(selected, null, 2) : "NONE: this element is not in the registry."}
</selected_feature>
<related_features>
${related.map((f) => JSON.stringify(f)).join("\n") || "none"}
</related_features>
<other_features_on_this_page>
${others.map(compact).join("\n") || "none"}
</other_features_on_this_page>
</feature_registry>`,
      `<selection>
${JSON.stringify(req.selection, null, 2)}
</selection>`,
    );
  } else {
    parts.push(
      `<feature_registry>
${visible.map((f) => JSON.stringify(f)).join("\n") || "none"}
</feature_registry>`,
    );
  }

  parts.push(
    `<page>${req.page.title} (id: ${req.page.id})</page>`,
    `<live_page_data>
${JSON.stringify(req.page.liveState, null, 2)}
</live_page_data>`,
  );

  return parts.join("\n\n");
}

const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/;

export function buildMessages(req: ChatRequest, screenshot?: string): Anthropic.MessageParam[] {
  const match = screenshot ? DATA_URL.exec(screenshot) : null;

  return req.messages.map((m, i) => {
    if (i === 0 && m.role === "user" && match) {
      return {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: match[1] as "image/jpeg" | "image/png" | "image/webp",
              data: match[2],
            },
          },
          { type: "text", text: `(Screenshot of the area I circled.)\n\n${m.content}` },
        ],
      };
    }
    return { role: m.role, content: m.content };
  });
}
