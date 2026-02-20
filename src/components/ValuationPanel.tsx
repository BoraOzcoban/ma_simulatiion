import { calculateValuation, getSharesOutstanding } from '../lib/finance';
import { useAppStore } from '../store/AppStore';

const fmtMoney = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(value);

const fmtM = (value: number) =>
  `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2
  }).format(value)} M`;

const fmtRatio = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 2 });

export function ValuationPanel() {
  const { state } = useAppStore();
  const m = calculateValuation(state.price, state.financials);

  const rows: Array<[string, string]> = [
    ['Shares Outstanding', `${(getSharesOutstanding() / 1_000_000_000).toFixed(1)} B`],
    ['Market Cap', fmtMoney(m.marketCap)],
    ['Book Value (Equity)', fmtM(state.financials.balance.equity)],
    ['Book Value / Share', fmtMoney(m.bookValuePerShare)],
    ['P/B', fmtRatio(m.pb)],
    ['Revenue (Current)', fmtM(state.financials.income.revenue)],
    ['P/S', fmtRatio(m.ps)],
    ['EPS (Current)', fmtMoney(state.financials.income.eps)],
    ['P/E', m.pe === null ? 'N/A' : fmtRatio(m.pe)],
    [m.netDebtOrCash >= 0 ? 'Net Debt' : 'Net Cash', fmtM(Math.abs(m.netDebtOrCash))]
  ];

  return (
    <section className="rounded-2xl bg-white p-5 shadow-panel dark:bg-slate-900">
      <h3 className="text-xl font-semibold">Valuation & Multiples</h3>
      <p className="mt-1 text-xs text-slate-500">Current (Simulated): updates with price and financials</p>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
            <p className="text-slate-500">{label}</p>
            <p className="mt-1 text-base font-semibold">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
