import { AccountsTable } from "./AccountsTable";
import { HeaderBar } from "./HeaderBar";
import { Shell } from "./Shell";
import { StatCards } from "./StatCards";
import { Toolbar } from "./Toolbar";

export const PAGE = { id: "accounts", title: "Accounts / Renewals Q4" } as const;

export function Dashboard() {
  return (
    <Shell header={<HeaderBar />}>
      <div data-page={PAGE.id} className="flex flex-col gap-4">
        <StatCards />
        <Toolbar />
        <AccountsTable />
      </div>
    </Shell>
  );
}
