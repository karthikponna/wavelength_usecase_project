import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ACCOUNTS,
  HEALTH_LABEL,
  formatArr,
  formatDate,
  healthBand,
  renewalDate,
  signalScore,
  type Account,
  type HealthBand,
  type SignalScore,
} from "./data";

export type Density = "comfortable" | "compact";

export type Filters = {
  search: string;
  segment: string | null;
  health: HealthBand | null;
  owner: string | null;
};

export type RankedAccount = Account & { signal: SignalScore };

type DashboardContextValue = {
  filters: Filters;
  setFilters: (patch: Partial<Filters>) => void;
  signalRank: boolean;
  toggleSignalRank: () => void;
  density: Density;
  setDensity: (d: Density) => void;
  rows: RankedAccount[];
  stats: {
    inView: number;
    total: number;
    arrRenewing30: number;
    renewing30: RankedAccount[];
    atRisk: RankedAccount[];
  };
  getLiveState: () => Record<string, unknown>;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<Filters>({
    search: "",
    segment: "SaaS",
    health: null,
    owner: null,
  });
  const [signalRank, setSignalRank] = useState(false);
  const [density, setDensity] = useState<Density>("comfortable");

  const setFilters = useCallback(
    (patch: Partial<Filters>) => setFiltersState((f) => ({ ...f, ...patch })),
    [],
  );
  const toggleSignalRank = useCallback(() => setSignalRank((v) => !v), []);

  const filtered = useMemo<RankedAccount[]>(() => {
    const q = filters.search.trim().toLowerCase();
    return ACCOUNTS.filter((a) => {
      if (q && !a.name.toLowerCase().includes(q) && !a.domain.toLowerCase().includes(q)) return false;
      if (filters.segment && !a.segments.includes(filters.segment)) return false;
      if (filters.health && healthBand(a.health) !== filters.health) return false;
      if (filters.owner && a.owner !== filters.owner) return false;
      return true;
    }).map((a) => ({ ...a, signal: signalScore(a) }));
  }, [filters]);

  const rows = useMemo(() => {
    const sorted = [...filtered];
    if (signalRank) sorted.sort((a, b) => b.signal.score - a.signal.score);
    else sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [filtered, signalRank]);

  const stats = useMemo(() => {
    const renewing30 = filtered.filter((a) => a.renewalInDays <= 30);
    return {
      inView: filtered.length,
      total: ACCOUNTS.length,
      arrRenewing30: renewing30.reduce((s, a) => s + a.arr, 0),
      renewing30,
      atRisk: filtered.filter((a) => healthBand(a.health) === "risk"),
    };
  }, [filtered]);

  const liveRef = useRef<Record<string, unknown>>({});
  liveRef.current = {
    today: formatDate(new Date()),
    filters: {
      search: filters.search || null,
      segment: filters.segment ?? "All segments",
      healthPulse: filters.health ? HEALTH_LABEL[filters.health] : "All",
      owner: filters.owner ?? "Everyone",
    },
    accountsInView: stats.inView,
    totalAccounts: stats.total,
    arrRenewingIn30Days: formatArr(stats.arrRenewing30),
    accountsRenewingIn30Days: stats.renewing30.map(
      (a) => `${a.name} (${formatArr(a.arr)}, renews ${formatDate(renewalDate(a.renewalInDays))})`,
    ),
    atRiskCount: stats.atRisk.length,
    atRiskAccounts: stats.atRisk.map((a) => `${a.name} (Health Pulse ${a.health})`),
    signalRankActive: signalRank,
    signalRankPreview: [...filtered]
      .sort((a, b) => b.signal.score - a.signal.score)
      .slice(0, 3)
      .map((a, i) => ({
        rank: i + 1,
        account: a.name,
        priorityScore: a.signal.score,
        reasons: a.signal.reasons,
      })),
    density,
    visibleAccounts: rows.map(
      (a) =>
        `${a.name}: Health ${a.health}, ARR ${formatArr(a.arr)}, renews in ${a.renewalInDays}d, owner ${a.owner}, segments ${a.segments.join("/")}`,
    ),
  };
  const getLiveState = useCallback(() => liveRef.current, []);

  const value = useMemo(
    () => ({ filters, setFilters, signalRank, toggleSignalRank, density, setDensity, rows, stats, getLiveState }),
    [filters, setFilters, signalRank, toggleSignalRank, density, rows, stats, getLiveState],
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used inside DashboardProvider");
  return ctx;
}
