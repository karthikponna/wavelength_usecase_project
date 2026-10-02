import { Check, ChevronRight, FileUp, Folder, Plus, RefreshCw, SlidersHorizontal, Sparkles, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useDashboard } from "./state";

const pill =
  "inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-[13px] font-medium text-zinc-800 shadow-xs transition-colors hover:bg-zinc-50";

export function HeaderBar() {
  const { signalRank, toggleSignalRank, density, setDensity } = useDashboard();

  return (
    <header
      data-section="header"
      className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-zinc-200 bg-white px-6"
    >
      <div className="flex items-center gap-2 text-[13px]">
        <span className="font-medium text-zinc-500">Accounts</span>
        <ChevronRight className="size-3.5 text-zinc-300" />
        <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-800">
          <Folder className="size-3.5 text-zinc-500" />
          Renewals Q4
        </span>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className={pill} data-feature="add-account">
              Add
              <Plus className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem>
              <UserPlus /> New account
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FileUp /> Import CSV
            </DropdownMenuItem>
            <DropdownMenuItem>
              <RefreshCw /> Sync from Salesforce
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className={pill} data-feature="view-options">
              View
              <SlidersHorizontal className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {(["comfortable", "compact"] as const).map((d) => (
              <DropdownMenuItem key={d} onSelect={() => setDensity(d)} className="capitalize">
                <Check className={cn(density === d ? "opacity-100" : "opacity-0")} />
                {d}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          data-feature="signal-rank"
          aria-pressed={signalRank}
          onClick={toggleSignalRank}
          className={cn(
            pill,
            "relative",
            signalRank && "border-orange-300 bg-orange-50 text-orange-800 hover:bg-orange-100",
          )}
        >
          <Sparkles className={cn("size-3.5", signalRank ? "text-orange-600" : "text-orange-500")} />
          Signal Rank
          <span className="absolute -right-1 -top-1 flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-orange-400 opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-orange-500 ring-2 ring-white" />
          </span>
        </button>
      </div>
    </header>
  );
}
