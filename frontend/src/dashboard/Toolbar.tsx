import { Activity, ChevronDown, LayoutGrid, Search, Sparkles, UserRound, X } from "lucide-react";
import type { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { HEALTH_LABEL, OWNERS, SEGMENTS, type HealthBand } from "./data";
import { useDashboard } from "./state";

const chip =
  "inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-[13px] text-zinc-700 transition-colors hover:bg-zinc-50";

function ChipMenu({
  feature,
  icon,
  label,
  value,
  children,
}: {
  feature?: string;
  icon: ReactNode;
  label: string;
  value: string | null;
  children: ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" data-feature={feature} className={cn(chip, value && "border-zinc-300")}>
          {icon}
          {label}
          {value && <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-800">{value}</span>}
          <ChevronDown className="size-3.5 text-zinc-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Toolbar() {
  const { filters, setFilters, signalRank } = useDashboard();

  return (
    <section data-section="toolbar" className="flex flex-wrap items-center gap-2">
      <label
        data-feature="account-search"
        className="flex h-8 w-72 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 text-[13px] focus-within:border-zinc-400"
      >
        <Search className="size-4 text-zinc-400" />
        <input
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          placeholder="Filter accounts by name..."
          className="w-full bg-transparent outline-none placeholder:text-zinc-400"
        />
      </label>

      {signalRank && (
        <span className="inline-flex h-7 items-center gap-1 rounded-full bg-orange-50 px-2.5 text-xs font-medium text-orange-700">
          <Sparkles className="size-3" /> Ranked by signals
        </span>
      )}

      <div className="ml-auto flex items-center gap-2">
        <div data-feature="segment-filter" className="flex items-center">
          <ChipMenu
            icon={<LayoutGrid className="size-3.5 text-zinc-500" />}
            label="Segment"
            value={filters.segment}
          >
            <DropdownMenuItem onSelect={() => setFilters({ segment: null })}>All segments</DropdownMenuItem>
            {SEGMENTS.map((s) => (
              <DropdownMenuItem key={s} onSelect={() => setFilters({ segment: s })}>
                {s}
              </DropdownMenuItem>
            ))}
          </ChipMenu>
          {filters.segment && (
            <button
              type="button"
              aria-label="Clear segment filter"
              onClick={() => setFilters({ segment: null })}
              className="-ml-px grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <ChipMenu
          feature="health-filter"
          icon={<Activity className="size-3.5 text-zinc-500" />}
          label="Health Pulse"
          value={filters.health ? HEALTH_LABEL[filters.health] : null}
        >
          <DropdownMenuItem onSelect={() => setFilters({ health: null })}>All</DropdownMenuItem>
          {(Object.keys(HEALTH_LABEL) as HealthBand[]).map((b) => (
            <DropdownMenuItem key={b} onSelect={() => setFilters({ health: b })}>
              {HEALTH_LABEL[b]}
            </DropdownMenuItem>
          ))}
        </ChipMenu>

        <ChipMenu
          feature="owner-filter"
          icon={<UserRound className="size-3.5 text-zinc-500" />}
          label="Owner"
          value={filters.owner?.split(" ")[0] ?? null}
        >
          <DropdownMenuItem onSelect={() => setFilters({ owner: null })}>Everyone</DropdownMenuItem>
          {OWNERS.map((o) => (
            <DropdownMenuItem key={o} onSelect={() => setFilters({ owner: o })}>
              {o}
            </DropdownMenuItem>
          ))}
        </ChipMenu>
      </div>
    </section>
  );
}
