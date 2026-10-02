import type { ReactNode } from "react";
import { Building2, ChartNoAxesColumn, Send, Settings, Workflow } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type NavItem = { icon: LucideIcon; label: string; feature?: string; active?: boolean };

const NAV: NavItem[] = [
  { icon: Building2, label: "Accounts", feature: "nav-accounts", active: true },
  { icon: Workflow, label: "Workflows", feature: "nav-workflows" },
  { icon: Send, label: "Outreach", feature: "nav-outreach" },
  { icon: ChartNoAxesColumn, label: "Insights", feature: "nav-insights" },
];

function Logo() {
  return (
    <div className="grid size-9 place-items-center rounded-xl bg-orange-500">
      <svg viewBox="0 0 32 32" className="size-6" aria-hidden>
        <path
          d="M5 18c3-6 5-6 7 0s4 6 7 0 4-6 7-2"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function RailButton({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={item.label}
          data-feature={item.feature}
          className={cn(
            "grid size-10 place-items-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900",
            item.active && "bg-orange-50 text-orange-600 hover:bg-orange-50 hover:text-orange-600",
          )}
        >
          <Icon className="size-[18px]" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}

export function Shell({ header, children }: { header: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-full bg-zinc-50">
      <nav
        data-section="rail"
        className="sticky top-0 flex h-screen w-16 shrink-0 flex-col items-center gap-2 border-r border-zinc-200 bg-white py-3"
      >
        <Logo />
        <div className="my-2 h-px w-6 bg-zinc-200" />
        {NAV.map((item) => (
          <RailButton key={item.label} item={item} />
        ))}
        <div className="mt-auto">
          <RailButton item={{ icon: Settings, label: "Settings" }} />
        </div>
      </nav>
      <div className="flex min-w-0 flex-1 flex-col">
        {header}
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
