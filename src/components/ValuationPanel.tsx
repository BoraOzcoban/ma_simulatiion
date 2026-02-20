import { calculateValuation, getSharesOutstanding } from '../lib/finance';
import { useAppStore } from '../store/AppStore';

const fmtMoney = (value: number) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(value);

const fmtM = (value: number) =>
  `${new Intl.NumberFormat('tr-TR', {
    maximumFractionDigits: 2
  }).format(value)} Mn`;

const fmtRatio = (value: number) => value.toLocaleString('tr-TR', { maximumFractionDigits: 2 });

export function ValuationPanel({ compact = false }: { compact?: boolean }) {
  const { state } = useAppStore();
  const m = calculateValuation(state.price, state.financials);

  const rows: Array<[string, string]> = [
    ['Dolaşımdaki Pay', `${(getSharesOutstanding() / 1_000_000_000).toFixed(1)} Mr`],
    ['Piyasa Değeri', fmtMoney(m.marketCap)],
    ['Defter Değeri (Özkaynak)', fmtM(state.financials.balance.equity)],
    ['Hisse Başına Defter Değeri', fmtMoney(m.bookValuePerShare)],
    ['P/B', fmtRatio(m.pb)],
    ['Gelir (Güncel)', fmtM(state.financials.income.revenue)],
    ['P/S', fmtRatio(m.ps)],
    ['Hisse Başına Kar (Güncel)', fmtMoney(state.financials.income.eps)],
    ['F/K', m.pe === null ? 'Yok' : fmtRatio(m.pe)],
    [m.netDebtOrCash >= 0 ? 'Net Borç' : 'Net Nakit', fmtM(Math.abs(m.netDebtOrCash))]
  ];

  if (compact) {
    return (
      <section className="mx-auto mb-4 max-w-[1900px] rounded-2xl bg-white p-3 shadow-panel dark:bg-slate-900">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Değerleme ve Çarpanlar</h3>
          <p className="text-[11px] text-slate-500">Güncel (Simüle)</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="min-w-[168px] shrink-0 rounded-lg border border-slate-200 px-2.5 py-2 text-xs dark:border-slate-700"
            >
              <p className="text-slate-500">{label}</p>
              <p className="mt-1 text-sm font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-panel dark:bg-slate-900">
      <h3 className="text-xl font-semibold">Değerleme ve Çarpanlar</h3>
      <p className="mt-1 text-xs text-slate-500">Güncel (Simüle): fiyat ve finansallarla birlikte güncellenir</p>
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
