import { motion } from "motion/react";
import { CalendarDays, Globe, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { HEALTH_LABEL, formatArr, formatDate, healthBand, renewalDate } from "./data";
import { useDashboard, type RankedAccount } from "./state";

const SEGMENT_TONE: Record<string, string> = {
  SaaS: "bg-violet-50 text-violet-700 border-violet-200",
  AI: "bg-orange-50 text-orange-700 border-orange-200",
  Fintech: "bg-pink-50 text-pink-700 border-pink-200",
  Security: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Dev Tools": "bg-sky-50 text-sky-700 border-sky-200",
  Productivity: "bg-amber-50 text-amber-700 border-amber-200",
  Design: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  "E-commerce": "bg-lime-50 text-lime-700 border-lime-200",
};

const HEALTH_TONE = {
  healthy: { dot: "bg-emerald-500", text: "text-emerald-700" },
  watch: { dot: "bg-amber-500", text: "text-amber-700" },
  risk: { dot: "bg-rose-500", text: "text-rose-700" },
} as const;

const AVATAR_TONES = ["bg-sky-100 text-sky-700", "bg-violet-100 text-violet-700", "bg-amber-100 text-amber-800", "bg-emerald-100 text-emerald-700", "bg-rose-100 text-rose-700", "bg-zinc-200 text-zinc-700"];

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("");
}

function avatarTone(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}

const COLUMNS = ["Account", "Health Pulse", "ARR", "Renewal", "Segments", "Owner"];

function Row({ a, rank, compact, signalRank }: { a: RankedAccount; rank: number; compact: boolean; signalRank: boolean }) {
  const band = healthBand(a.health);
  const Logo = a.logo;
  const cell = cn("border-b border-r border-zinc-100 px-3 last:border-r-0", compact ? "py-1.5" : "py-2.5");

  return (
    <motion.tr layout transition={{ type: "spring", stiffness: 500, damping: 40 }} className="bg-white hover:bg-zinc-50/70">
      <td className={cn(cell, "w-[260px] max-w-[260px]")}>
        <div className="flex items-center gap-2.5">
          {signalRank && <span className="w-4 text-xs font-semibold tabular-nums text-orange-600">{rank}</span>}
          <span className="grid size-7 shrink-0 place-items-center rounded-md border border-zinc-200 bg-white">
            <Logo className="size-4" style={{ color: a.logoColor }} />
          </span>
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-zinc-900">{a.name}</div>
            {signalRank && a.signal.reasons.length > 0 ? (
              <div className="flex items-center gap-1 truncate text-[11px] text-orange-700">
                <Sparkles className="size-3 shrink-0" />
                <span className="truncate">{a.signal.reasons.join(" · ")}</span>
              </div>
            ) : (
              <a
                href={`https://${a.domain}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
              >
                <Globe className="size-3" />
                {a.domain}
              </a>
            )}
          </div>
        </div>
      </td>
      <td className={cell}>
        <span data-feature="health-pulse" className="inline-flex items-center gap-2 text-[13px]">
          <span className={cn("size-2 rounded-full", HEALTH_TONE[band].dot)} />
          <span className="font-medium tabular-nums text-zinc-900">{a.health}</span>
          <span className={cn("text-xs", HEALTH_TONE[band].text)}>{HEALTH_LABEL[band]}</span>
        </span>
      </td>
      <td className={cn(cell, "text-[13px] font-medium tabular-nums text-zinc-800")}>{formatArr(a.arr)}</td>
      <td className={cell}>
        <span className="inline-flex items-center gap-1.5 text-[13px] text-zinc-700">
          <CalendarDays className="size-3.5 text-zinc-400" />
          {formatDate(renewalDate(a.renewalInDays))}
          {a.renewalInDays <= 30 && (
            <span className="rounded border border-amber-200 bg-amber-50 px-1 text-[11px] font-medium text-amber-700">
              {a.renewalInDays}d
            </span>
          )}
        </span>
      </td>
      <td className={cell}>
        <div className="flex flex-wrap gap-1">
          {a.segments.map((s) => (
            <span key={s} className={cn("rounded-md border px-1.5 py-0.5 text-xs", SEGMENT_TONE[s])}>
              {s}
            </span>
          ))}
        </div>
      </td>
      <td className={cell}>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 py-0.5 pl-0.5 pr-2.5 text-[13px] text-zinc-800">
          <span className={cn("grid size-5 place-items-center rounded-full text-[10px] font-semibold", avatarTone(a.owner))}>
            {initials(a.owner)}
          </span>
          {a.owner}
        </span>
      </td>
    </motion.tr>
  );
}

export function AccountsTable() {
  const { rows, density, signalRank } = useDashboard();

  return (
    <section data-section="accounts-table" className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-xs">
      <table className="w-full min-w-[900px] border-collapse text-left">
        <thead>
          <tr className="bg-zinc-50/80">
            {COLUMNS.map((c) => (
              <th
                key={c}
                data-feature={c === "Health Pulse" ? "health-pulse" : undefined}
                className="border-b border-r border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-500 last:border-r-0"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((a, i) => (
            <Row key={a.id} a={a} rank={i + 1} compact={density === "compact"} signalRank={signalRank} />
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={COLUMNS.length} className="px-3 py-10 text-center text-sm text-zinc-500">
                No accounts match these filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
