import registryJson from "../shared/feature-registry.json";
import type { FeatureEntry, WhatsNewItem } from "../shared/types";

const registry = registryJson as FeatureEntry[];
const byId = new Map(registry.map((f) => [f.id, f]));

export function getFeature(id: string | null | undefined): FeatureEntry | undefined {
  return id ? byId.get(id) : undefined;
}

export function getFeatures(ids: Iterable<string>): FeatureEntry[] {
  const out: FeatureEntry[] = [];
  for (const id of new Set(ids)) {
    const f = byId.get(id);
    if (f) out.push(f);
  }
  return out;
}

export function summaries(): WhatsNewItem[] {
  return registry.map(({ id, name, whatItDoes, location, shippedOn, isNew }) => ({
    id,
    name,
    whatItDoes,
    location,
    shippedOn,
    isNew,
  }));
}

export function whatsNew(limit = 5): WhatsNewItem[] {
  return summaries()
    .sort((a, b) => b.shippedOn.localeCompare(a.shippedOn))
    .slice(0, limit);
}
