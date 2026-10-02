import { AlertTriangle, CalendarClock, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatArr } from "./data";
import { useDashboard } from "./state";

function StatCard({
  feature,
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  feature: string;
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  tone: string;
}) {
  return (
    <div data-feature={feature} className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-xs">
      <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
        <span className={`grid size-6 place-items-center rounded-md ${tone}`}>
          <Icon className="size-3.5" />
        </span>
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">{value}</div>
      <div className="mt-0.5 text-xs text-zinc-500">{hint}</div>
    </div>
  );
}

export function StatCards() {
  const { stats } = useDashboard();
  return (
    <section data-section="stats" className="grid grid-cols-3 gap-3">
      <StatCard
        feature="stat-accounts-in-view"
        icon={Users}
        label="Accounts in view"
        value={String(stats.inView)}
        hint={`of ${stats.total} in your book of business`}
        tone="bg-blue-50 text-blue-600"
      />
      <StatCard
        feature="stat-renewals-30d"
        icon={CalendarClock}
        label="Renewing in 30 days"
        value={formatArr(stats.arrRenewing30)}
        hint={`${stats.renewing30.length} accounts up for renewal`}
        tone="bg-amber-50 text-amber-600"
      />
      <StatCard
        feature="stat-at-risk"
        icon={AlertTriangle}
        label="At-risk accounts"
        value={String(stats.atRisk.length)}
        hint="Health Pulse below 50"
        tone="bg-rose-50 text-rose-600"
      />
    </section>
  );
}
