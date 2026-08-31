import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { FilterBar } from "@/components/common/FilterBar";
import { KpiCard, Panel, StatusPill } from "@/components/common/primitives";
import { SpotDrawer } from "@/components/drawers/SpotDrawer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useGlobalFilters } from "@/hooks/use-global-filters";
import {
  CAMPAIGNS,
  CHANNELS,
  COUNTRIES,
  KPI_DEFS,
  REGIONS,
  SCENARIOS,
  SKUS,
  SPOTS,
  WEEKS,
  fmtMoney,
  fmtUnits,
  type Spot,
} from "@/data/mock";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Spot Planning — FarmaTodo Promotion Intelligence Studio" },
      {
        name: "description",
        content:
          "Monitor promotional performance at campaign, SKU, week, region and channel level with causal ROI, margin and cannibalization signals.",
      },
      { property: "og:title", content: "Spot Planning — FarmaTodo Promotion Intelligence Studio" },
      { property: "og:description", content: "Enterprise promotion planning across campaign, SKU, week, region and channel." },
    ],
  }),
  component: SpotPlanning,
});

const GROUPS: { label: string; span: number; tone: string }[] = [
  { label: "Identity", span: 5, tone: "bg-surface-muted" },
  { label: "Pricing", span: 2, tone: "bg-info-soft" },
  { label: "Volume", span: 3, tone: "bg-surface-muted" },
  { label: "Financials", span: 3, tone: "bg-info-soft" },
  { label: "Profitability", span: 2, tone: "bg-surface-muted" },
  { label: "Efficiency", span: 2, tone: "bg-info-soft" },
  { label: "Signal", span: 3, tone: "bg-surface-muted" },
];

function SpotPlanning() {
  const { filters } = useGlobalFilters();
  const [selected, setSelected] = useState<Spot | null>(null);
  const [statuses, setStatuses] = useState<Record<string, Spot["status"]>>({});
  const sym = COUNTRIES[filters.country].symbol;

  const rows = useMemo(
    () =>
      SPOTS.filter(
        (s) =>
          (filters.campaign === "All" || s.campaign === filters.campaign) &&
          (filters.channel === "All" || s.channel === filters.channel) &&
          (filters.region === "All" || s.region === filters.region) &&
          (filters.sku === "All" || s.sku === filters.sku) &&
          (filters.week === "All" || s.week === filters.week),
      ),
    [filters],
  );

  const scale = filters.scenario === "Optimized" ? 1.09 : filters.scenario === "Planner Override" ? 0.96 : 1;

  const kpis = useMemo(() => {
    const rev = rows.reduce((a, r) => a + r.totalRevenue, 0) * scale;
    const roi = rows.length ? rows.reduce((a, r) => a + r.roi, 0) / rows.length / 100 : 0;
    return KPI_DEFS.map((k) => {
      if (k.key === "revenue") return { ...k, value: fmtMoney(rev, sym) };
      if (k.key === "roi") return { ...k, value: `${(roi * scale).toFixed(2)}x` };
      if (k.key === "incunits") return { ...k, value: fmtUnits(rows.reduce((a, r) => a + r.uplift, 0) * scale) };
      if (k.key === "active") return { ...k, value: String(rows.length * 3) };
      return k;
    });
  }, [rows, scale, sym]);

  const act = (spot: Spot, next: Spot["status"]) => {
    setStatuses((s) => ({ ...s, [spot.id]: next }));
    toast.success(`${spot.campaign} · ${spot.sku} · ${spot.week} → ${next}`);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-tight">Spot Planning</h1>
          <p className="text-xs text-muted-foreground">
            Promotional performance at campaign × SKU × week × region × channel — {filters.country} ({COUNTRIES[filters.country].currency})
          </p>
        </div>
        <StatusPill tone="info">Scenario: {filters.scenario}</StatusPill>
      </div>

      <FilterBar
        defs={[
          { key: "campaign", label: "Campaign", options: CAMPAIGNS },
          { key: "channel", label: "Channel", options: CHANNELS },
          { key: "region", label: "Region", options: REGIONS },
          { key: "sku", label: "SKU", options: SKUS },
          { key: "week", label: "Week", options: WEEKS },
          { key: "scenario", label: "Scenario", options: SCENARIOS },
        ]}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <KpiCard key={k.key} label={k.label} value={k.value} delta={k.delta} tip={k.tip} positiveIsGood={k.good !== false} compact />
        ))}
      </div>

      <Panel
        title="Spot Grid"
        subtitle={`${rows.length} promotional spots — click a row for the full causal and economic detail`}
        bodyClassName="p-0"
      >
        <div className="max-h-[520px] overflow-auto">
          <table className="w-full min-w-[1500px] border-collapse text-xs">
            <thead className="sticky top-0 z-10">
              <tr>
                {GROUPS.map((g) => (
                  <th
                    key={g.label}
                    colSpan={g.span}
                    className={`${g.tone} border-b border-border px-3 py-1.5 text-left text-[10px] font-semibold tracking-wider text-muted-foreground uppercase`}
                  >
                    {g.label}
                  </th>
                ))}
              </tr>
              <tr className="bg-surface">
                {[
                  "Campaign",
                  "SKU",
                  "Week",
                  "Region",
                  "Channel",
                  "Reg. Price",
                  "Promo Price",
                  "Base Units",
                  "Uplift",
                  "Total Units",
                  "Inc. Sales",
                  "Base Revenue",
                  "Total Revenue",
                  "Inc. Margin",
                  "Total Margin",
                  "ROI",
                  "Budget Util.",
                  "Cannib.",
                  "Confidence",
                  "Action",
                ].map((h) => (
                  <th key={h} className="border-b border-border px-3 py-2 text-left font-medium whitespace-nowrap text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const status = statuses[r.id] ?? r.status;
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className="cursor-pointer border-b border-border/70 transition-colors hover:bg-info-soft/60"
                  >
                    <td className="px-3 py-2 font-medium whitespace-nowrap">{r.campaign}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{r.sku}</td>
                    <td className="px-3 py-2">{r.week}</td>
                    <td className="px-3 py-2">{r.region}</td>
                    <td className="px-3 py-2">{r.channel}</td>
                    <td className="px-3 py-2 tabular-nums">{sym}{r.regularPrice.toFixed(2)}</td>
                    <td className="px-3 py-2 font-medium tabular-nums text-primary">{sym}{r.promoPrice.toFixed(2)}</td>
                    <td className="px-3 py-2 tabular-nums">{r.baseUnits.toLocaleString()}</td>
                    <td className="px-3 py-2 font-medium tabular-nums text-success">+{Math.round(r.uplift * scale)}</td>
                    <td className="px-3 py-2 tabular-nums">{fmtUnits(r.baseUnits + r.uplift * scale)}</td>
                    <td className="px-3 py-2 tabular-nums">{fmtMoney(r.incSales * scale, sym)}</td>
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">{fmtMoney(r.baseRevenue, sym)}</td>
                    <td className="px-3 py-2 font-medium tabular-nums">{fmtMoney(r.totalRevenue * scale, sym)}</td>
                    <td className="px-3 py-2 tabular-nums text-success">{fmtMoney(r.incMargin * scale, sym)}</td>
                    <td className="px-3 py-2 tabular-nums">{fmtMoney(r.totalMargin * scale, sym)}</td>
                    <td className="px-3 py-2">
                      <StatusPill tone={r.roi * scale >= 120 ? "pass" : r.roi * scale >= 90 ? "warn" : "fail"}>
                        {Math.round(r.roi * scale)}%
                      </StatusPill>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-surface-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${r.budgetUtil}%` }} />
                        </div>
                        <span className="tabular-nums text-muted-foreground">{r.budgetUtil}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 tabular-nums text-warning-foreground">{r.cannibalization.toFixed(1)}%</td>
                    <td className="px-3 py-2 tabular-nums">{r.confidence}%</td>
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      {status === "Approved" ? (
                        <StatusPill tone="pass">
                          <CheckCircle2 className="h-3 w-3" /> Approved
                        </StatusPill>
                      ) : (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-6 px-2 text-[11px]" onClick={() => act(r, "Submitted")}>
                            <Send className="h-3 w-3" /> {status === "Submitted" ? "Resubmit" : "Submit"}
                          </Button>
                          <Button size="sm" className="h-6 px-2 text-[11px]" onClick={() => act(r, "Approved")}>
                            Approve
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={20} className="px-3 py-10 text-center text-muted-foreground">
                    No spots match the current filter selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <SpotDrawer spot={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
